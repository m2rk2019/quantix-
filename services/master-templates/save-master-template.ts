'use server';

import { revalidatePath } from 'next/cache';

import { requireProvisionedUserProfile } from '@/lib/auth/session';
import { ROUTES } from '@/lib/constants/routes';
import {
  compareTemplateVersions,
  formatTemplateVersionLabel,
  initialTemplateVersion,
  nextTemplateVersion,
} from '@/lib/master-templates/template-version';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/services/audit/log-audit-event';
import { buildMasterTemplateSnapshot } from '@/services/master-templates/build-template-snapshot';
import type { ActionResult } from '@/services/projects/create-project';
import type { Json } from '@/types/database';
import { canCreateProjectRole } from '@/types/project';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

/**
 * Resolve the stable family key for versioning.
 * Prefer prior versions saved from this project, then matching display name.
 */
async function resolveTemplateFamilyKey(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  displayName: string
): Promise<string> {
  const { data: fromProject } = await supabase
    .from('master_templates')
    .select('template_key, template_version, created_at')
    .eq('created_from_project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (fromProject && fromProject.length > 0) {
    return fromProject[0].template_key;
  }

  // Legacy rows may only have source_project_id
  const { data: fromSource } = await supabase
    .from('master_templates')
    .select('template_key')
    .eq('source_project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (fromSource?.[0]?.template_key) {
    return fromSource[0].template_key;
  }

  const desiredKey = slugify(displayName) || 'master-template';
  const { data: byName } = await supabase
    .from('master_templates')
    .select('template_key, display_name')
    .ilike('display_name', displayName)
    .order('created_at', { ascending: false })
    .limit(1);

  if (byName?.[0]?.template_key) {
    return byName[0].template_key;
  }

  return desiredKey;
}

async function latestVersionForFamily(
  supabase: Awaited<ReturnType<typeof createClient>>,
  templateKey: string
): Promise<string | null> {
  const { data } = await supabase
    .from('master_templates')
    .select('template_version')
    .eq('template_key', templateKey);

  if (!data || data.length === 0) return null;

  return data
    .map((row) => String(row.template_version ?? '1.0'))
    .sort(compareTemplateVersions)
    .at(-1) ?? null;
}

/**
 * Save approved project as a NEW Master Template version.
 * Never overwrites an existing template row — always INSERT.
 */
export async function saveProjectAsMasterTemplate(input: {
  projectId: string;
  displayName?: string;
  description?: string;
}): Promise<ActionResult & { templateId?: string; templateVersion?: string }> {
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
    return { success: false, error: 'Permission denied.' };
  }

  const supabase = await createClient();

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, status, project_name')
    .eq('id', input.projectId)
    .is('deleted_at', null)
    .maybeSingle();

  if (projectError || !project) {
    return { success: false, error: 'Project not found.' };
  }

  if (project.status !== 'approved') {
    return {
      success: false,
      error:
        'Only approved projects can be saved as Master Templates. Approve the estimate first.',
    };
  }

  const snapshot = await buildMasterTemplateSnapshot(input.projectId);
  if (!snapshot) {
    return { success: false, error: 'Project not found.' };
  }

  const displayName =
    input.displayName?.trim() ||
    `${snapshot.project_info.project_name} Template`;

  const templateKey = await resolveTemplateFamilyKey(
    supabase,
    input.projectId,
    displayName
  );
  const latest = await latestVersionForFamily(supabase, templateKey);
  const templateVersion = latest
    ? nextTemplateVersion(latest)
    : initialTemplateVersion();

  const { data: details } = await supabase
    .from('project_details')
    .select('smart_import_job_id')
    .eq('project_id', input.projectId)
    .maybeSingle();

  await supabase
    .from('project_details')
    .update({ is_master_template: true, updated_by: profile.id })
    .eq('project_id', input.projectId);

  // Always INSERT — never UPDATE an existing master_templates row
  const { data: template, error } = await supabase
    .from('master_templates')
    .insert({
      template_key: templateKey,
      template_version: templateVersion,
      display_name: displayName,
      description:
        input.description?.trim() ||
        'Reusable master template — update quantities and project-specific rates only.',
      source_project_id: input.projectId,
      created_from_project_id: input.projectId,
      source_import_job_id: details?.smart_import_job_id ?? null,
      snapshot: snapshot as unknown as Json,
      wbs_count: snapshot.wbs.length,
      boq_count: snapshot.boq.length,
      resource_count: snapshot.resources.length,
      is_active: true,
      created_by: profile.id,
    })
    .select('id, template_version')
    .single();

  if (error || !template) {
    if (
      error?.message?.includes('does not exist') ||
      error?.message?.includes('schema cache') ||
      error?.message?.includes('template_version') ||
      error?.code === '42P01'
    ) {
      return {
        success: false,
        error:
          'Master Template versioning columns are not applied yet. Run supabase/fixes/master-template-versioning.sql',
      };
    }
    return { success: false, error: error?.message ?? 'Failed to save template.' };
  }

  if (details?.smart_import_job_id) {
    await supabase
      .from('smart_import_jobs')
      .update({ master_template_id: template.id })
      .eq('id', details.smart_import_job_id);
  }

  await logAuditEvent({
    projectId: input.projectId,
    entityType: 'master_template',
    entityId: template.id,
    action: 'master_template.saved',
    actorId: profile.id,
    module: 'admin',
    remarks: `Saved master template ${displayName} ${formatTemplateVersionLabel(templateVersion)}`,
    payload: {
      template_id: template.id,
      template_key: templateKey,
      template_version: templateVersion,
      created_from_project_id: input.projectId,
      wbs_count: snapshot.wbs.length,
      boq_count: snapshot.boq.length,
      resource_count: snapshot.resources.length,
    },
  });

  revalidatePath(ROUTES.masterTemplates);
  revalidatePath(ROUTES.project(input.projectId));

  return {
    success: true,
    projectId: input.projectId,
    templateId: template.id,
    templateVersion,
  };
}
