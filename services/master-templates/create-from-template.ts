'use server';

import { revalidatePath } from 'next/cache';

import { requireProvisionedUserProfile } from '@/lib/auth/session';
import { ROUTES } from '@/lib/constants/routes';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/services/audit/log-audit-event';
import { refreshProjectEstimate } from '@/services/estimate/refresh-project-estimate';
import { createProject } from '@/services/projects/create-project';
import type { ActionResult } from '@/services/projects/create-project';
import type { MasterTemplateSnapshot } from '@/types/master-template';
import type { RateLibraryCategory } from '@/types/database';
import { canCreateProjectRole } from '@/types/project';

function asCategory(value: string): RateLibraryCategory {
  const allowed: RateLibraryCategory[] = [
    'material',
    'labor',
    'equipment',
    'subcontract',
    'service',
    'productivity',
  ];
  return (allowed as string[]).includes(value)
    ? (value as RateLibraryCategory)
    : 'material';
}

export async function createProjectFromMasterTemplate(input: {
  templateId: string;
  projectName?: string;
  clientName?: string;
  location?: string | null;
}): Promise<ActionResult> {
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
  const { data: template, error } = await supabase
    .from('master_templates')
    .select('id, display_name, snapshot, template_version, template_key')
    .eq('id', input.templateId)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !template) {
    return { success: false, error: 'Master template not found.' };
  }

  const templateVersion = String(template.template_version ?? '1.0');

  const snapshot = template.snapshot as unknown as MasterTemplateSnapshot;
  if (!snapshot?.wbs || !snapshot?.boq) {
    return { success: false, error: 'Template snapshot is incomplete.' };
  }

  const resolvedLocation =
    input.location === undefined
      ? snapshot.project_info.location
      : input.location;

  const createResult = await createProject({
    project_name:
      input.projectName?.trim() ||
      `${snapshot.project_info.project_name} (From Template)`,
    client_name:
      input.clientName?.trim() || snapshot.project_info.client_name || 'Client',
    location: resolvedLocation ?? undefined,
    description: `Created from master template: ${template.display_name}`,
  });

  if (!createResult.success || !createResult.projectId) {
    return {
      success: false,
      error: createResult.error ?? 'Failed to create project.',
    };
  }

  const projectId = createResult.projectId;

  const { error: detailsError } = await supabase
    .from('project_details')
    .update({
      source_master_template_id: input.templateId,
      source_master_template_version: templateVersion,
      assumptions: snapshot.project_info.assumptions,
      exclusions: snapshot.project_info.exclusions,
      commercial_notes: snapshot.project_info.commercial_notes,
      currency: snapshot.project_info.currency || 'PHP',
      vat_percent: snapshot.project_info.vat_percent,
      markup_percent: snapshot.project_info.markup_percent,
      contingency_percent: snapshot.project_info.contingency_percent,
      indirect_cost_percent: snapshot.project_info.indirect_cost_percent,
      building_type: snapshot.project_info.building_type,
      contract_type: snapshot.project_info.contract_type,
      updated_by: profile.id,
    })
    .eq('project_id', projectId);

  if (detailsError) {
    if (
      detailsError.message?.includes('source_master_template') ||
      detailsError.message?.includes('schema cache')
    ) {
      return {
        success: false,
        error:
          'Master Template versioning columns are not applied yet. Run supabase/fixes/master-template-versioning.sql',
      };
    }
    return { success: false, error: detailsError.message };
  }

  const wbsIdMap = new Map<string, string>();
  const sortedWbs = [...snapshot.wbs].sort(
    (a, b) => a.level - b.level || a.sort_order - b.sort_order
  );
  for (const node of sortedWbs) {
    const { data: created, error: wbsError } = await supabase
      .from('wbs')
      .insert({
        project_id: projectId,
        parent_id: node.parent_id ? (wbsIdMap.get(node.parent_id) ?? null) : null,
        level: node.level,
        wbs_code: node.wbs_code,
        description: node.description,
        sort_order: node.sort_order,
        created_by: profile.id,
        updated_by: profile.id,
      })
      .select('id')
      .single();
    if (wbsError || !created) {
      return { success: false, error: wbsError?.message ?? 'Failed to copy WBS.' };
    }
    wbsIdMap.set(node.id, created.id);
  }

  const resourceIdMap = new Map<string, string>();
  for (const item of snapshot.resources) {
    const { data: created, error: resourceError } = await supabase
      .from('project_rate_library_items')
      .insert({
        project_id: projectId,
        code: item.code,
        description: item.description,
        unit: item.unit || 'item',
        unit_cost: item.unit_cost,
        category: asCategory(item.category),
        is_active: true,
        created_by: profile.id,
        updated_by: profile.id,
      })
      .select('id')
      .single();
    if (resourceError || !created) {
      return {
        success: false,
        error: resourceError?.message ?? 'Failed to copy project resources.',
      };
    }
    resourceIdMap.set(item.id, created.id);
  }

  const boqIdMap = new Map<string, string>();
  for (const item of snapshot.boq) {
    const newWbsId = wbsIdMap.get(item.wbs_id);
    if (!newWbsId) continue;
    const { data: created, error: boqError } = await supabase
      .from('boq_items')
      .insert({
        project_id: projectId,
        wbs_id: newWbsId,
        item_code: item.item_code,
        description: item.description,
        unit: item.unit || 'item',
        quantity: item.quantity,
        material_rate: item.material_rate,
        labor_rate: item.labor_rate,
        equipment_rate: item.equipment_rate,
        subcontract_rate: item.subcontract_rate,
        other_cost_rate: item.other_cost_rate,
        total_rate: item.total_rate,
        total_amount: item.total_amount,
        created_by: profile.id,
        updated_by: profile.id,
      })
      .select('id')
      .single();
    if (boqError || !created) {
      return { success: false, error: boqError?.message ?? 'Failed to copy BOQ.' };
    }
    boqIdMap.set(item.id, created.id);
  }

  const analysisRows = snapshot.rate_analysis
    .map((line) => {
      const newBoqId = boqIdMap.get(line.boq_item_id);
      if (!newBoqId) return null;
      return {
        boq_item_id: newBoqId,
        project_library_item_id: line.project_library_item_id
          ? (resourceIdMap.get(line.project_library_item_id) ?? null)
          : null,
        library_item_id: line.library_item_id,
        category: asCategory(line.category),
        resource_name: line.resource_name,
        unit: line.unit || 'item',
        consumption: line.consumption,
        unit_cost: line.unit_cost,
        waste_percent: line.waste_percent,
        productivity: line.productivity,
        amount: line.amount,
        sort_order: line.sort_order,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  if (analysisRows.length > 0) {
    const { error: analysisError } = await supabase
      .from('boq_rate_analysis_lines')
      .insert(analysisRows);
    if (analysisError) {
      return { success: false, error: analysisError.message };
    }
  }

  await refreshProjectEstimate(projectId, profile.id);

  await logAuditEvent({
    projectId,
    entityType: 'master_template',
    entityId: input.templateId,
    action: 'master_template.project_created',
    actorId: profile.id,
    module: 'admin',
    remarks: `Created project from template ${template.display_name} v${templateVersion}`,
    payload: {
      template_id: input.templateId,
      template_key: template.template_key,
      template_version: templateVersion,
      new_project_id: projectId,
    },
  });

  revalidatePath(ROUTES.projects);
  revalidatePath(ROUTES.masterTemplates);
  revalidatePath(ROUTES.project(projectId));

  return { success: true, projectId };
}
