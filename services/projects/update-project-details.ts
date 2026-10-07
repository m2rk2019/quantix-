'use server';

import { revalidatePath } from 'next/cache';

import { diffAuditFields } from '@/lib/audit/diff-fields';
import {
  ESTIMATE_SETTING_FIELDS,
  FIELD_LABELS,
  PROJECT_DETAIL_FIELDS,
} from '@/lib/audit/constants';
import { requireUserProfile } from '@/lib/auth/session';
import { ROUTES } from '@/lib/constants/routes';
import { createClient } from '@/lib/supabase/server';
import { logProjectAuditChanges } from '@/services/audit/log-audit-event';import { refreshProjectEstimate } from '@/services/estimate/refresh-project-estimate';
import type { ActionResult } from '@/services/projects/create-project';
import type { UpdateProjectDetailsInput } from '@/types/project';
import { canEditProjectMetadata } from '@/types/project';
import { isProjectStatus } from '@/types/project';

function parsePercent(value: number): number {
  return Math.round(value * 100) / 100;
}

function isValidPercent(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 100;
}

export async function updateProjectDetails(
  projectId: string,
  input: UpdateProjectDetailsInput
): Promise<ActionResult> {
  const profile = await requireUserProfile();
  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from('projects')
    .select('id, status, created_by, project_name, client_name, location')
    .eq('id', projectId)
    .is('deleted_at', null)
    .maybeSingle();

  if (fetchError || !existing) {
    return { success: false, error: 'Project not found.' };
  }

  const { data: existingDetails } = await supabase
    .from('project_details')
    .select(
      'description, owner, consultant, contractor, project_type, contract_type, currency, vat_percent, markup_percent, contingency_percent, indirect_cost_percent, rounding_rule, measurement_system, default_unit_system'
    )
    .eq('project_id', projectId)
    .maybeSingle();

  const status = isProjectStatus(existing.status) ? existing.status : 'draft';
  const isOwner = existing.created_by === profile.id;

  if (!canEditProjectMetadata(profile.role, status, isOwner)) {
    return {
      success: false,
      error: 'You do not have permission to edit this project.',
    };
  }

  if (!input.project_name.trim()) {
    return { success: false, error: 'Project name is required.' };
  }

  if (!input.client_name.trim()) {
    return { success: false, error: 'Client name is required.' };
  }

  if (!input.currency) {
    return { success: false, error: 'Currency is required.' };
  }

  const percentages = [
    { field: 'VAT %', value: input.vat_percent },
    { field: 'Markup %', value: input.markup_percent },
    { field: 'Contingency %', value: input.contingency_percent },
    { field: 'Indirect Cost %', value: input.indirect_cost_percent },
  ];

  for (const { field, value } of percentages) {
    if (!isValidPercent(value)) {
      return {
        success: false,
        error: `${field} must be between 0 and 100.`,
      };
    }
  }

  const { error: projectError } = await supabase
    .from('projects')
    .update({
      project_name: input.project_name.trim(),
      client_name: input.client_name.trim(),
      location: input.location?.trim() || null,
      updated_by: profile.id,
    })
    .eq('id', projectId);

  if (projectError) {
    return { success: false, error: projectError.message };
  }

  const { error: detailsError } = await supabase
    .from('project_details')
    .update({
      description: input.description?.trim() || null,
      owner: input.owner?.trim() || null,
      consultant: input.consultant?.trim() || null,
      contractor: input.contractor?.trim() || null,
      project_type: input.project_type || null,
      contract_type: input.contract_type || null,
      currency: input.currency,
      vat_percent: parsePercent(input.vat_percent),
      markup_percent: parsePercent(input.markup_percent),
      contingency_percent: parsePercent(input.contingency_percent),
      indirect_cost_percent: parsePercent(input.indirect_cost_percent),
      rounding_rule: input.rounding_rule,
      measurement_system: input.measurement_system,
      default_unit_system: input.default_unit_system,
      updated_by: profile.id,
    })
    .eq('project_id', projectId);

  if (detailsError) {
    return { success: false, error: detailsError.message };
  }

  await refreshProjectEstimate(projectId, profile.id);

  const beforeState: Record<string, unknown> = {
    project_name: existing.project_name,
    client_name: existing.client_name,
    location: existing.location,
    description: existingDetails?.description ?? null,
    owner: existingDetails?.owner ?? null,
    consultant: existingDetails?.consultant ?? null,
    contractor: existingDetails?.contractor ?? null,
    project_type: existingDetails?.project_type ?? null,
    contract_type: existingDetails?.contract_type ?? null,
    currency: existingDetails?.currency ?? null,
    vat_percent: existingDetails?.vat_percent ?? 0,
    markup_percent: existingDetails?.markup_percent ?? 0,
    contingency_percent: existingDetails?.contingency_percent ?? 0,
    indirect_cost_percent: existingDetails?.indirect_cost_percent ?? 0,
    rounding_rule: existingDetails?.rounding_rule ?? 'half_up',
    measurement_system: existingDetails?.measurement_system ?? 'metric',
    default_unit_system: existingDetails?.default_unit_system ?? 'metric_si',
  };

  const afterState: Record<string, unknown> = {
    project_name: input.project_name.trim(),
    client_name: input.client_name.trim(),
    location: input.location?.trim() || null,
    description: input.description?.trim() || null,
    owner: input.owner?.trim() || null,
    consultant: input.consultant?.trim() || null,
    contractor: input.contractor?.trim() || null,
    project_type: input.project_type || null,
    contract_type: input.contract_type || null,
    currency: input.currency,
    vat_percent: parsePercent(input.vat_percent),
    markup_percent: parsePercent(input.markup_percent),
    contingency_percent: parsePercent(input.contingency_percent),
    indirect_cost_percent: parsePercent(input.indirect_cost_percent),
    rounding_rule: input.rounding_rule,
    measurement_system: input.measurement_system,
    default_unit_system: input.default_unit_system,
  };

  const trackedFields = [
    ...PROJECT_DETAIL_FIELDS,
    ...ESTIMATE_SETTING_FIELDS,
  ] as const;

  const fieldChanges = diffAuditFields(beforeState, afterState, trackedFields);

  const detailChanges = fieldChanges.filter((change) =>
    (PROJECT_DETAIL_FIELDS as readonly string[]).includes(change.field)
  );
  const settingChanges = fieldChanges.filter((change) =>
    (ESTIMATE_SETTING_FIELDS as readonly string[]).includes(change.field)
  );

  await logProjectAuditChanges({
    projectId,
    entityType: 'project',
    entityId: projectId,
    actorId: profile.id,
    module: 'project_details',
    changes: detailChanges.map((change) => ({
      action: 'project.details_updated',
      field: change.field,
      oldValue: change.oldValue,
      newValue: change.newValue,
      remarks: FIELD_LABELS[change.field] ?? change.field,
    })),
  });

  await logProjectAuditChanges({
    projectId,
    entityType: 'project',
    entityId: projectId,
    actorId: profile.id,
    module: 'estimate_settings',
    changes: settingChanges.map((change) => ({
      action: 'project.estimate_setting_changed',
      field: change.field,
      oldValue: change.oldValue,
      newValue: change.newValue,
      remarks: FIELD_LABELS[change.field] ?? change.field,
    })),
  });

  revalidatePath(ROUTES.projects);
  revalidatePath(ROUTES.project(projectId));
  revalidatePath(ROUTES.projectWbs(projectId));
  revalidatePath(ROUTES.projectBoq(projectId));
  revalidatePath(ROUTES.projectSummary(projectId));
  revalidatePath(ROUTES.projectAudit(projectId));

  return { success: true, projectId };
}
