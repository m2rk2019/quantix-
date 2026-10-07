import { createClient } from '@/lib/supabase/server';
import { countProjectBoqItems } from '@/services/boq/list-boq-items';
import { countProjectWbsNodes } from '@/services/wbs/list-wbs-nodes';
import { parseCurrencyCode } from '@/lib/constants/currency';
import type {
  ContractType,
  CurrencyCode,
  DefaultUnitSystem,
  MeasurementSystem,
  ProjectDetailsRecord,
  ProjectType,
  RoundingRule,
} from '@/types/project';
import { isProjectStatus } from '@/types/project';

function parseProjectType(value: string | null): ProjectType | null {
  const types: ProjectType[] = [
    'residential',
    'commercial',
    'industrial',
    'infrastructure',
    'civil',
    'renovation',
    'other',
  ];
  return types.includes(value as ProjectType) ? (value as ProjectType) : null;
}

function parseContractType(value: string | null): ContractType | null {
  const types: ContractType[] = [
    'lump_sum',
    'unit_price',
    'cost_plus',
    'design_build',
    'management',
    'other',
  ];
  return types.includes(value as ContractType) ? (value as ContractType) : null;
}

function parseCurrency(value: string | null | undefined): CurrencyCode {
  return parseCurrencyCode(value);
}

function parseMeasurementSystem(
  value: string | null | undefined
): MeasurementSystem {
  return value === 'imperial' ? 'imperial' : 'metric';
}

function parseRoundingRule(value: string | null | undefined): RoundingRule {
  const rules: RoundingRule[] = [
    'half_up',
    'half_down',
    'round_up',
    'round_down',
  ];
  return rules.includes(value as RoundingRule)
    ? (value as RoundingRule)
    : 'half_up';
}

function parseDefaultUnitSystem(
  value: string | null | undefined
): DefaultUnitSystem {
  const systems: DefaultUnitSystem[] = [
    'metric_si',
    'imperial_us',
    'metric_imperial_hybrid',
  ];
  return systems.includes(value as DefaultUnitSystem)
    ? (value as DefaultUnitSystem)
    : 'metric_si';
}

export async function getProjectDetails(
  projectId: string
): Promise<ProjectDetailsRecord | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('projects')
    .select(
      `
        id,
        project_code,
        project_name,
        client_name,
        location,
        status,
        created_by,
        updated_by,
        created_at,
        updated_at,
        submitted_at,
        approved_at,
        archived_at,
        creator:users!projects_created_by_fkey(full_name),
        updater:users!projects_updated_by_fkey(full_name),
        project_details(
          description,
          owner,
          consultant,
          contractor,
          project_type,
          contract_type,
          currency,
          vat_percent,
          markup_percent,
          contingency_percent,
          indirect_cost_percent,
          rounding_rule,
          measurement_system,
          default_unit_system,
          source_master_template_id,
          source_master_template_version,
          template_reuse_report
        ),
        estimate_summary(direct_cost)
      `
    )
    .eq('id', projectId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const creator = Array.isArray(data.creator) ? data.creator[0] : data.creator;
  const updater = Array.isArray(data.updater) ? data.updater[0] : data.updater;
  const details = Array.isArray(data.project_details)
    ? data.project_details[0]
    : data.project_details;
  const summary = Array.isArray(data.estimate_summary)
    ? data.estimate_summary[0]
    : data.estimate_summary;
  const status = isProjectStatus(data.status) ? data.status : 'draft';
  const wbsNodeCount = await countProjectWbsNodes(projectId);
  const boqItemCount = await countProjectBoqItems(projectId);

  const sourceTemplateId = details?.source_master_template_id ?? null;
  let sourceTemplateVersion =
    details?.source_master_template_version != null
      ? String(details.source_master_template_version)
      : null;
  let sourceTemplateName: string | null = null;
  if (sourceTemplateId) {
    const { data: template } = await supabase
      .from('master_templates')
      .select('display_name, template_version')
      .eq('id', sourceTemplateId)
      .maybeSingle();
    sourceTemplateName = template?.display_name ?? null;
    if (!sourceTemplateVersion && template?.template_version) {
      sourceTemplateVersion = String(template.template_version);
    }
  }

  const reuseReportRaw = details?.template_reuse_report;
  const templateReuseReport =
    reuseReportRaw &&
    typeof reuseReportRaw === 'object' &&
    !Array.isArray(reuseReportRaw) &&
    Object.keys(reuseReportRaw as object).length > 0
      ? (reuseReportRaw as Record<string, unknown>)
      : null;

  return {
    id: data.id,
    project_code: data.project_code,
    project_name: data.project_name,
    client_name: data.client_name,
    location: data.location,
    status,
    created_by: data.created_by,
    updated_by: data.updated_by,
    created_at: data.created_at,
    updated_at: data.updated_at,
    submitted_at: data.submitted_at,
    approved_at: data.approved_at,
    archived_at: data.archived_at,
    description: details?.description ?? null,
    created_by_name: creator?.full_name ?? 'Unknown',
    updated_by_name: updater?.full_name ?? null,
    owner: details?.owner ?? null,
    consultant: details?.consultant ?? null,
    contractor: details?.contractor ?? null,
    project_type: parseProjectType(details?.project_type ?? null),
    contract_type: parseContractType(details?.contract_type ?? null),
    currency: parseCurrency(details?.currency),
    vat_percent: Number(details?.vat_percent ?? 0),
    markup_percent: Number(details?.markup_percent ?? 0),
    contingency_percent: Number(details?.contingency_percent ?? 0),
    indirect_cost_percent: Number(details?.indirect_cost_percent ?? 0),
    rounding_rule: parseRoundingRule(details?.rounding_rule),
    measurement_system: parseMeasurementSystem(details?.measurement_system),
    default_unit_system: parseDefaultUnitSystem(details?.default_unit_system),
    grand_total: Number(summary?.direct_cost ?? 0),
    wbs_node_count: wbsNodeCount,
    boq_item_count: boqItemCount,
    source_master_template_id: sourceTemplateId,
    source_master_template_name: sourceTemplateName,
    source_master_template_version: sourceTemplateVersion,
    template_reuse_report: templateReuseReport,
  };
}
