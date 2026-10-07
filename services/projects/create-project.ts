'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireProvisionedUserProfile } from '@/lib/auth/session';
import { ROUTES } from '@/lib/constants/routes';
import { getCompanySettings } from '@/services/company-settings/get-company-settings';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/services/audit/log-audit-event';
import type { CreateProjectInput } from '@/types/project';
import { canCreateProjectRole } from '@/types/project';

export interface ActionResult {
  success: boolean;
  error?: string;
  projectId?: string;
}

export async function createProject(
  input: CreateProjectInput
): Promise<ActionResult> {
  let profile;
  try {
    profile = await requireProvisionedUserProfile();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unauthorized',
    };
  }

  if (!canCreateProjectRole(profile.role)) {
    return { success: false, error: 'You do not have permission to create projects.' };
  }

  if (!input.project_name.trim()) {
    return { success: false, error: 'Project name is required.' };
  }

  if (!input.client_name.trim()) {
    return { success: false, error: 'Client is required.' };
  }

  const supabase = await createClient();
  const company = await getCompanySettings();

  const { data: projectCode, error: codeError } = await supabase.rpc(
    'generate_project_code'
  );

  if (codeError || !projectCode) {
    return { success: false, error: 'Failed to generate project code.' };
  }

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      project_code: projectCode,
      project_name: input.project_name.trim(),
      client_name: input.client_name.trim(),
      location: input.location?.trim() || null,
      status: 'draft',
      created_by: profile.id,
      updated_by: profile.id,
    })
    .select('id')
    .single();

  if (projectError || !project) {
    return { success: false, error: projectError?.message ?? 'Failed to create project.' };
  }

  const { error: detailsError } = await supabase.from('project_details').insert({
    project_id: project.id,
    description: input.description?.trim() || null,
    currency: company.default_currency,
    vat_percent: company.default_vat_percent,
    markup_percent: company.default_profit_percent,
    contingency_percent: company.default_contingency_percent,
    indirect_cost_percent: company.default_ocm_percent,
    rounding_rule: 'half_up',
    measurement_system: 'metric',
    default_unit_system: 'metric_si',
    created_by: profile.id,
    updated_by: profile.id,
  });

  if (detailsError) {
    return { success: false, error: detailsError.message };
  }

  const { error: summaryError } = await supabase.from('estimate_summary').insert({
    project_id: project.id,
    created_by: profile.id,
    updated_by: profile.id,
  });

  if (summaryError) {
    return { success: false, error: summaryError.message };
  }

  await logAuditEvent({
    projectId: project.id,
    entityType: 'project',
    entityId: project.id,
    action: 'project.created',
    actorId: profile.id,
    module: 'lifecycle',
    oldValue: null,
    newValue: 'draft',
    remarks: `Project code ${projectCode}`,
    payload: {
      project_code: projectCode,
      new_status: 'draft',
    },
  });

  revalidatePath(ROUTES.projects);
  revalidatePath(ROUTES.dashboard);

  return { success: true, projectId: project.id };
}

export async function createProjectAndRedirect(
  input: CreateProjectInput
): Promise<void> {
  const result = await createProject(input);

  if (result.success && result.projectId) {
    redirect(ROUTES.project(result.projectId));
  }

  redirect(`${ROUTES.projectNew}?error=${encodeURIComponent(result.error ?? 'Failed')}`);
}
