import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/services/audit/log-audit-event';
import type { ActionResult } from '@/services/projects/create-project';
import { assertProjectRateEditAccess } from '@/services/project-rate-library/assert-project-rate-access';
import type { UpdateProjectRateItemInput } from '@/types/project-rate-library';
import type { Database } from '@/types/database';

type ProjectRateUpdate =
  Database['public']['Tables']['project_rate_library_items']['Update'];

export async function updateProjectRateItem(
  projectId: string,
  itemId: string,
  input: UpdateProjectRateItemInput
): Promise<ActionResult> {
  const access = await assertProjectRateEditAccess(projectId);
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from('project_rate_library_items')
    .select('id, code, description, unit_cost, source_company_item_id')
    .eq('id', itemId)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .maybeSingle();

  if (fetchError || !existing) {
    return { success: false, error: 'Project rate item not found.' };
  }

  const patch: ProjectRateUpdate = {
    updated_by: access.ctx.profileId,
  };

  if (input.code !== undefined) {
    const code = input.code.trim();
    if (!code) {
      return { success: false, error: 'Code is required.' };
    }
    patch.code = code;
  }
  if (input.description !== undefined) {
    const description = input.description.trim();
    if (!description) {
      return { success: false, error: 'Description is required.' };
    }
    patch.description = description;
  }
  if (input.unit !== undefined) {
    patch.unit = input.unit.trim() || 'item';
  }
  if (input.unit_cost !== undefined) {
    if (input.unit_cost < 0) {
      return { success: false, error: 'Unit cost must be >= 0.' };
    }
    patch.unit_cost = input.unit_cost;
  }
  if (input.category !== undefined) {
    patch.category = input.category;
  }
  if (input.is_active !== undefined) {
    patch.is_active = input.is_active;
  }
  if (input.supplier_id !== undefined) {
    patch.supplier_id = input.supplier_id;
  }
  if (input.unit_id !== undefined) {
    patch.unit_id = input.unit_id;
  }
  if (input.resource_category_id !== undefined) {
    patch.resource_category_id = input.resource_category_id;
  }
  if (input.ignore_company_updates !== undefined) {
    patch.ignore_company_updates = input.ignore_company_updates;
  }

  const { error } = await supabase
    .from('project_rate_library_items')
    .update(patch)
    .eq('id', itemId)
    .eq('project_id', projectId)
    .is('deleted_at', null);

  if (error) {
    return { success: false, error: error.message };
  }

  if (input.unit_cost !== undefined) {
    const { cascadeProjectRateCostChange } = await import(
      '@/services/project-rate-library/cascade-project-rate-change'
    );
    const cascade = await cascadeProjectRateCostChange(
      projectId,
      itemId,
      input.unit_cost,
      access.ctx.profileId
    );
    if (!cascade.success) {
      return {
        success: false,
        error: cascade.error ?? 'Failed to cascade rate into BOQ.',
      };
    }
  }

  try {
    await logAuditEvent({
      projectId,
      entityType: 'project_rate_library_item',
      entityId: itemId,
      action: 'project_rate.updated',
      actorId: access.ctx.profileId,
      module: 'project_rate',
      oldValue: `${existing.code} @ ${existing.unit_cost}`,
      newValue:
        input.unit_cost !== undefined
          ? `${patch.code ?? existing.code} @ ${input.unit_cost}`
          : existing.description,
      remarks: 'Updated project-owned rate resource (company master unchanged)',
      payload: {
        source_company_item_id: existing.source_company_item_id,
        fields: Object.keys(input),
      },
    });
  } catch (auditError) {
    console.error('[Project Rate Library] update audit failed', auditError);
  }

  return { success: true };
}
