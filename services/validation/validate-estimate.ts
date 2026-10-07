import {
  calculateTotalAmount,
  calculateTotalRate,
  roundCurrency,
} from '@/lib/boq/calculations';
import { calculateEstimateBreakdown } from '@/lib/estimate/calculations';
import { ROUTES } from '@/lib/constants/routes';
import { createClient } from '@/lib/supabase/server';
import {
  getEstimatePercentages,
  sumDirectCost,
} from '@/services/estimate/sync-estimate-summary';
import type {
  EstimateValidationResult,
  ValidationCategoryId,
  ValidationCategorySummary,
  ValidationCheck,
  ValidationSeverity,
} from '@/types/validation';
import type { UserRole } from '@/types/auth';

const AMOUNT_TOLERANCE = 0.01;

function worstSeverity(
  checks: ValidationCheck[]
): ValidationSeverity {
  if (checks.some((check) => check.severity === 'error')) {
    return 'error';
  }
  if (checks.some((check) => check.severity === 'warning')) {
    return 'warning';
  }
  return 'passed';
}

function scoreChecks(checks: ValidationCheck[]): number {
  if (checks.length === 0) {
    return 100;
  }

  const points = checks.reduce((sum, check) => {
    if (check.severity === 'passed') {
      return sum + 1;
    }
    if (check.severity === 'warning') {
      return sum + 0.5;
    }
    return sum;
  }, 0);

  return Math.round((points / checks.length) * 100);
}

function buildCategories(
  checks: ValidationCheck[]
): ValidationCategorySummary[] {
  const categoryIds: ValidationCategoryId[] = [
    'project_details',
    'wbs',
    'boq',
    'estimate_summary',
  ];

  const labels: Record<ValidationCategoryId, string> = {
    project_details: 'Project Details',
    wbs: 'WBS',
    boq: 'BOQ',
    estimate_summary: 'Estimate Summary',
  };

  return categoryIds.map((id) => {
    const categoryChecks = checks.filter((check) => check.category === id);
    return {
      id,
      label: labels[id],
      severity: worstSeverity(categoryChecks),
      checks: categoryChecks,
    };
  });
}

export function canExportProjectExcel(
  role: UserRole,
  isOwner: boolean
): boolean {
  if (role === 'viewer') {
    return false;
  }

  if (role === 'estimator') {
    return isOwner;
  }

  return (
    role === 'super_admin' ||
    role === 'admin' ||
    role === 'quantity_surveyor'
  );
}

export async function validateEstimate(
  projectId: string,
  options?: { role?: UserRole; userId?: string }
): Promise<EstimateValidationResult> {
  const supabase = await createClient();
  const checks: ValidationCheck[] = [];

  const detailsPath = ROUTES.project(projectId);
  const wbsPath = ROUTES.projectWbs(projectId);
  const boqPath = ROUTES.projectBoq(projectId);
  const summaryPath = ROUTES.projectSummary(projectId);

  const [
    { data: project },
    { data: details },
    { data: wbsNodes },
    { data: boqItems },
    { data: summary },
  ] = await Promise.all([
    supabase
      .from('projects')
      .select('project_name, client_name, location, created_by')
      .eq('id', projectId)
      .is('deleted_at', null)
      .maybeSingle(),
    supabase
      .from('project_details')
      .select(
        'description, owner, consultant, contractor, project_type, contract_type, currency, indirect_cost_percent, contingency_percent, markup_percent, vat_percent'
      )
      .eq('project_id', projectId)
      .maybeSingle(),
    supabase
      .from('wbs')
      .select('id, parent_id, wbs_code, description')
      .eq('project_id', projectId)
      .is('deleted_at', null),
    supabase
      .from('boq_items')
      .select(
        'id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount'
      )
      .eq('project_id', projectId)
      .is('deleted_at', null),
    supabase
      .from('estimate_summary')
      .select(
        'direct_cost, indirect_cost, contingency, markup, vat, grand_total'
      )
      .eq('project_id', projectId)
      .maybeSingle(),
  ]);

  if (!project) {
    return {
      scorePercent: 0,
      categories: [],
      checks: [
        {
          id: 'project_missing',
          label: 'Project exists',
          severity: 'error',
          message: 'Project not found.',
          category: 'project_details',
        },
      ],
      hasCriticalErrors: true,
      hasExportPermission: false,
      canExport: false,
      exportBlockedReason: 'Project not found.',
    };
  }

  const missingProjectFields: string[] = [];
  if (!project.project_name?.trim()) {
    missingProjectFields.push('project name');
  }
  if (!project.client_name?.trim()) {
    missingProjectFields.push('client name');
  }
  if (!details?.currency) {
    missingProjectFields.push('currency');
  }
  if (!project.location?.trim()) {
    missingProjectFields.push('location');
  }
  if (!details?.description?.trim()) {
    missingProjectFields.push('description');
  }
  if (!details?.project_type) {
    missingProjectFields.push('project type');
  }
  if (!details?.contract_type) {
    missingProjectFields.push('contract type');
  }

  const requiredMissing = missingProjectFields.filter((field) =>
    ['project name', 'client name', 'currency'].includes(field)
  );
  const optionalMissing = missingProjectFields.filter(
    (field) => !requiredMissing.includes(field)
  );

  checks.push({
    id: 'project_details_complete',
    label: 'Project details complete',
    severity:
      requiredMissing.length > 0
        ? 'error'
        : optionalMissing.length > 0
          ? 'warning'
          : 'passed',
    message:
      requiredMissing.length > 0
        ? `Missing required fields: ${requiredMissing.join(', ')}.`
        : optionalMissing.length > 0
          ? `Optional fields incomplete: ${optionalMissing.join(', ')}.`
          : 'All project detail fields are complete.',
    category: 'project_details',
    goToPath:
      requiredMissing.length > 0 || optionalMissing.length > 0
        ? detailsPath
        : undefined,
    goToLabel: 'Go to Project Details',
  });

  const clientFields = [
    { key: 'client name', value: project.client_name },
    { key: 'owner', value: details?.owner },
    { key: 'consultant', value: details?.consultant },
    { key: 'contractor', value: details?.contractor },
  ];
  const missingClient = clientFields
    .filter((field) => !field.value?.trim())
    .map((field) => field.key);

  checks.push({
    id: 'client_information_complete',
    label: 'Client information complete',
    severity:
      !project.client_name?.trim()
        ? 'error'
        : missingClient.length > 1
          ? 'warning'
          : 'passed',
    message:
      !project.client_name?.trim()
        ? 'Client name is required.'
        : missingClient.length > 1
          ? `Incomplete client fields: ${missingClient.join(', ')}.`
          : 'Client information is complete.',
    category: 'project_details',
    goToPath: missingClient.length > 0 ? detailsPath : undefined,
    goToLabel: 'Go to Client Information',
  });

  const wbsList = wbsNodes ?? [];
  const boqList = boqItems ?? [];

  checks.push({
    id: 'wbs_exists',
    label: 'WBS exists',
    severity: wbsList.length === 0 ? 'error' : 'passed',
    message:
      wbsList.length === 0
        ? 'At least one WBS node is required.'
        : `${wbsList.length} WBS node${wbsList.length === 1 ? '' : 's'} found.`,
    category: 'wbs',
    goToPath: wbsList.length === 0 ? wbsPath : undefined,
    goToLabel: 'Go to WBS',
  });

  const boqCountByWbs = new Map<string, number>();
  for (const item of boqList) {
    boqCountByWbs.set(item.wbs_id, (boqCountByWbs.get(item.wbs_id) ?? 0) + 1);
  }

  const childrenByParent = new Map<string, string[]>();
  for (const node of wbsList) {
    if (!node.parent_id) {
      continue;
    }
    const list = childrenByParent.get(node.parent_id) ?? [];
    list.push(node.id);
    childrenByParent.set(node.parent_id, list);
  }

  const nodesWithoutBoq = wbsList.filter((node) => {
    const hasBoq = (boqCountByWbs.get(node.id) ?? 0) > 0;
    const hasChildren = (childrenByParent.get(node.id) ?? []).length > 0;
    return !hasBoq && !hasChildren;
  });

  const parentNodesWithoutBoq = wbsList.filter((node) => {
    const hasBoq = (boqCountByWbs.get(node.id) ?? 0) > 0;
    const hasChildren = (childrenByParent.get(node.id) ?? []).length > 0;
    return !hasBoq && hasChildren;
  });

  checks.push({
    id: 'wbs_nodes_have_boq',
    label: 'Every WBS node has BOQ items',
    severity:
      nodesWithoutBoq.length > 0
        ? 'error'
        : parentNodesWithoutBoq.length > 0
          ? 'warning'
          : 'passed',
    message:
      nodesWithoutBoq.length > 0
        ? `${nodesWithoutBoq.length} leaf WBS node(s) have no BOQ items.`
        : parentNodesWithoutBoq.length > 0
          ? `${parentNodesWithoutBoq.length} parent node(s) have no direct BOQ items.`
          : 'All WBS nodes have BOQ coverage.',
    category: 'wbs',
    goToPath:
      nodesWithoutBoq.length > 0 || parentNodesWithoutBoq.length > 0
        ? boqPath
        : undefined,
    goToLabel: 'Go to BOQ',
  });

  const wbsIds = new Set(wbsList.map((node) => node.id));
  const orphanItems = boqList.filter((item) => !wbsIds.has(item.wbs_id));

  checks.push({
    id: 'no_orphan_boq',
    label: 'No orphan BOQ items',
    severity: orphanItems.length > 0 ? 'error' : 'passed',
    message:
      orphanItems.length > 0
        ? `${orphanItems.length} BOQ item(s) reference missing WBS nodes.`
        : 'All BOQ items are linked to valid WBS nodes.',
    category: 'boq',
    goToPath: orphanItems.length > 0 ? boqPath : undefined,
    goToLabel: 'Go to BOQ',
  });

  const missingUnits = boqList.filter((item) => !item.unit?.trim());
  checks.push({
    id: 'required_units',
    label: 'Required units completed',
    severity: missingUnits.length > 0 ? 'error' : 'passed',
    message:
      missingUnits.length > 0
        ? `${missingUnits.length} item(s) are missing a unit of measure.`
        : 'All BOQ items have a unit of measure.',
    category: 'boq',
    goToPath: missingUnits.length > 0 ? boqPath : undefined,
    goToLabel: 'Go to BOQ',
  });

  const invalidQuantity = boqList.filter(
    (item) => Number(item.quantity) <= 0
  );
  checks.push({
    id: 'quantity_positive',
    label: 'Quantity greater than zero',
    severity:
      boqList.length === 0
        ? 'warning'
        : invalidQuantity.length > 0
          ? 'error'
          : 'passed',
    message:
      boqList.length === 0
        ? 'No BOQ items to validate.'
        : invalidQuantity.length > 0
          ? `${invalidQuantity.length} item(s) have quantity of zero or less.`
          : 'All quantities are greater than zero.',
    category: 'boq',
    goToPath: invalidQuantity.length > 0 ? boqPath : undefined,
    goToLabel: 'Go to BOQ',
  });

  const negativeRates = boqList.filter((item) => {
    const rates = [
      item.material_rate,
      item.labor_rate,
      item.equipment_rate,
      item.subcontract_rate,
      item.other_cost_rate,
    ];
    return rates.some((rate) => Number(rate) < 0);
  });
  checks.push({
    id: 'rates_non_negative',
    label: 'Rates are zero or greater',
    severity: negativeRates.length > 0 ? 'error' : 'passed',
    message:
      negativeRates.length > 0
        ? `${negativeRates.length} item(s) have negative rates.`
        : 'All rates are valid.',
    category: 'boq',
    goToPath: negativeRates.length > 0 ? boqPath : undefined,
    goToLabel: 'Go to BOQ',
  });

  // Project Resource Library awareness (Phase 3)
  const ratesPath = ROUTES.projectRates(projectId);
  const { count: projectResourceCount, error: projectResourceError } =
    await supabase
      .from('project_rate_library_items')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .eq('is_active', true);

  const usesProjectLibrary =
    !projectResourceError && (projectResourceCount ?? 0) > 0;

  checks.push({
    id: 'project_resource_library_source',
    label: 'Resource library source',
    severity: 'passed',
    message: usesProjectLibrary
      ? `Using Project Resource Library (${(projectResourceCount ?? 0).toLocaleString()} items).`
      : 'Project Resource Library is empty — Company Resource Library is used automatically.',
    category: 'boq',
    goToPath: ratesPath,
    goToLabel: 'Go to Rate Library',
  });

  const boqIds = boqList.map((item) => item.id);
  let missingProjectLinks = 0;
  let orphanProjectLinks = 0;

  if (boqIds.length > 0) {
    const { data: analysisLines } = await supabase
      .from('boq_rate_analysis_lines')
      .select('id, boq_item_id, library_item_id, project_library_item_id')
      .in('boq_item_id', boqIds)
      .is('deleted_at', null);

    const linkedProjectIds = Array.from(
      new Set(
        (analysisLines ?? [])
          .map((line) => line.project_library_item_id)
          .filter((id): id is string => Boolean(id))
      )
    );

    if (linkedProjectIds.length > 0) {
      const { data: existingProjectResources } = await supabase
        .from('project_rate_library_items')
        .select('id')
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .in('id', linkedProjectIds);

      const existingSet = new Set(
        (existingProjectResources ?? []).map((row) => row.id)
      );
      orphanProjectLinks = linkedProjectIds.filter(
        (id) => !existingSet.has(id)
      ).length;
    }

    if (usesProjectLibrary) {
      missingProjectLinks = (analysisLines ?? []).filter(
        (line) =>
          !line.project_library_item_id &&
          !line.library_item_id
      ).length;
    }
  }

  checks.push({
    id: 'project_resources_linked',
    label: 'Rate analysis resources linked',
    severity:
      orphanProjectLinks > 0
        ? 'error'
        : missingProjectLinks > 0
          ? 'warning'
          : 'passed',
    message:
      orphanProjectLinks > 0
        ? `${orphanProjectLinks} rate-analysis line(s) reference missing Project Resource Library items.`
        : missingProjectLinks > 0
          ? `${missingProjectLinks} rate-analysis line(s) have no library resource link (manual rates).`
          : usesProjectLibrary
            ? 'Project rate-analysis resources are linked to the Project Resource Library.'
            : 'Resource links validated against Company Resource Library fallback.',
    category: 'boq',
    goToPath:
      orphanProjectLinks > 0 || missingProjectLinks > 0 ? boqPath : undefined,
    goToLabel: 'Go to BOQ',
  });

  const codeCounts = new Map<string, number>();
  for (const item of boqList) {
    const code = item.item_code.trim().toLowerCase();
    codeCounts.set(code, (codeCounts.get(code) ?? 0) + 1);
  }
  const duplicateCodes = [...codeCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([code]) => code);

  checks.push({
    id: 'no_duplicate_boq',
    label: 'No duplicate BOQ items',
    severity: duplicateCodes.length > 0 ? 'error' : 'passed',
    message:
      duplicateCodes.length > 0
        ? `Duplicate item codes: ${duplicateCodes.join(', ')}.`
        : 'All BOQ item codes are unique.',
    category: 'boq',
    goToPath: duplicateCodes.length > 0 ? boqPath : undefined,
    goToLabel: 'Go to BOQ',
  });

  const blankDescriptions = boqList.filter(
    (item) => !item.description?.trim()
  );
  checks.push({
    id: 'no_blank_descriptions',
    label: 'No blank descriptions',
    severity: blankDescriptions.length > 0 ? 'error' : 'passed',
    message:
      blankDescriptions.length > 0
        ? `${blankDescriptions.length} item(s) have blank descriptions.`
        : 'All BOQ descriptions are completed.',
    category: 'boq',
    goToPath: blankDescriptions.length > 0 ? boqPath : undefined,
    goToLabel: 'Go to BOQ',
  });

  const amountMismatches = boqList.filter((item) => {
    const totalRate = calculateTotalRate({
      material_rate: Number(item.material_rate),
      labor_rate: Number(item.labor_rate),
      equipment_rate: Number(item.equipment_rate),
      subcontract_rate: Number(item.subcontract_rate),
      other_cost_rate: Number(item.other_cost_rate ?? 0),
    });
    const expectedAmount = calculateTotalAmount(
      Number(item.quantity),
      totalRate
    );
    const storedAmount = roundCurrency(Number(item.total_amount));
    return Math.abs(storedAmount - expectedAmount) > AMOUNT_TOLERANCE;
  });

  checks.push({
    id: 'total_amount_matches',
    label: 'Total amount matches calculations',
    severity: amountMismatches.length > 0 ? 'error' : 'passed',
    message:
      amountMismatches.length > 0
        ? `${amountMismatches.length} item(s) have incorrect total amounts.`
        : 'All BOQ amounts match quantity × total rate.',
    category: 'boq',
    goToPath: amountMismatches.length > 0 ? boqPath : undefined,
    goToLabel: 'Go to BOQ',
  });

  let estimateSeverity: ValidationSeverity = 'passed';
  let estimateMessage = 'Estimate summary recalculates successfully.';
  let estimateGoTo: string | undefined;

  try {
    const directCost = await sumDirectCost(projectId);
    const percentages = await getEstimatePercentages(projectId);
    const breakdown = calculateEstimateBreakdown(directCost, percentages);

    if (!summary) {
      estimateSeverity = 'error';
      estimateMessage = 'Estimate summary record is missing.';
      estimateGoTo = summaryPath;
    } else if (breakdown.grand_total <= 0 && boqList.length > 0) {
      estimateSeverity = 'warning';
      estimateMessage = 'Grand total is zero despite BOQ items.';
      estimateGoTo = summaryPath;
    } else if (
      Math.abs(Number(summary.direct_cost) - breakdown.direct_cost) >
        AMOUNT_TOLERANCE ||
      Math.abs(Number(summary.grand_total) - breakdown.grand_total) >
        AMOUNT_TOLERANCE
    ) {
      estimateSeverity = 'error';
      estimateMessage =
        'Stored estimate summary does not match recalculated values.';
      estimateGoTo = summaryPath;
    }
  } catch (error) {
    estimateSeverity = 'error';
    estimateMessage =
      error instanceof Error
        ? error.message
        : 'Estimate summary failed to recalculate.';
    estimateGoTo = summaryPath;
  }

  checks.push({
    id: 'estimate_summary_recalculates',
    label: 'Estimate summary recalculates',
    severity: estimateSeverity,
    message: estimateMessage,
    category: 'estimate_summary',
    goToPath: estimateGoTo,
    goToLabel: 'Go to Estimate Summary',
  });

  const markupPercents = [
    Number(details?.indirect_cost_percent ?? 0),
    Number(details?.contingency_percent ?? 0),
    Number(details?.markup_percent ?? 0),
    Number(details?.vat_percent ?? 0),
  ];

  checks.push({
    id: 'estimate_markup_percentages',
    label: 'Markup percentages valid',
    severity: markupPercents.some((value) => value < 0 || value > 100)
      ? 'error'
      : 'passed',
    message: markupPercents.some((value) => value < 0 || value > 100)
      ? 'Markup percentages must be between 0 and 100.'
      : 'All markup percentages are within valid range.',
    category: 'estimate_summary',
    goToPath: summaryPath,
    goToLabel: 'Go to Estimate Summary',
  });

  if (summary) {
    const summaryAmounts = [
      Number(summary.direct_cost),
      Number(summary.indirect_cost),
      Number(summary.contingency),
      Number(summary.markup),
      Number(summary.vat),
      Number(summary.grand_total),
    ];
    const hasNegative = summaryAmounts.some((value) => value < 0);

    checks.push({
      id: 'estimate_summary_non_negative',
      label: 'Estimate totals non-negative',
      severity: hasNegative ? 'error' : 'passed',
      message: hasNegative
        ? 'Estimate summary contains negative totals.'
        : 'All estimate totals are non-negative.',
      category: 'estimate_summary',
      goToPath: summaryPath,
      goToLabel: 'Go to Estimate Summary',
    });
  }

  if (boqList.length > 0 && (wbsNodes?.length ?? 0) > 0) {
    const rootWbsCount = (wbsNodes ?? []).filter(
      (node) => !node.parent_id
    ).length;

    checks.push({
      id: 'estimate_category_breakdown',
      label: 'Category breakdown available',
      severity: rootWbsCount === 0 ? 'warning' : 'passed',
      message:
        rootWbsCount === 0
          ? 'WBS discipline categories are missing for breakdown.'
          : 'WBS categories are available for cost breakdown.',
      category: 'estimate_summary',
      goToPath: wbsPath,
      goToLabel: 'Go to WBS',
    });
  }

  const hasCriticalErrors = checks.some(
    (check) => check.severity === 'error'
  );
  const isOwner = options?.userId
    ? project.created_by === options.userId
    : false;
  const hasExportPermission =
    options?.role !== undefined
      ? canExportProjectExcel(options.role, isOwner)
      : true;

  const canExport = hasExportPermission && !hasCriticalErrors;

  let exportBlockedReason: string | undefined;
  if (!hasExportPermission) {
    exportBlockedReason = 'You do not have permission to export this project.';
  } else if (hasCriticalErrors) {
    exportBlockedReason =
      'Resolve all critical validation errors before exporting.';
  }

  return {
    scorePercent: scoreChecks(checks),
    categories: buildCategories(checks),
    checks,
    hasCriticalErrors,
    hasExportPermission,
    canExport,
    exportBlockedReason,
  };
}
