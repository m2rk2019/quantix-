import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/services/audit/log-audit-event';
import type { ActionResult } from '@/services/projects/create-project';
import { assertProjectRateEditAccess } from '@/services/project-rate-library/assert-project-rate-access';
import type { CreateProjectRateItemInput } from '@/types/project-rate-library';

export async function createProjectRateItem(
  input: CreateProjectRateItemInput
): Promise<ActionResult & { itemId?: string }> {
  const access = await assertProjectRateEditAccess(input.project_id);
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const code = input.code.trim();
  const description = input.description.trim();
  const unit = input.unit.trim() || 'item';

  if (!code) {
    return { success: false, error: 'Code is required.' };
  }
  if (!description) {
    return { success: false, error: 'Description is required.' };
  }
  if (input.unit_cost < 0) {
    return { success: false, error: 'Unit cost must be >= 0.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('project_rate_library_items')
    .insert({
      project_id: input.project_id,
      code,
      description,
      unit,
      unit_cost: input.unit_cost,
      category: input.category,
      is_active: input.is_active ?? true,
      supplier_id: input.supplier_id ?? null,
      unit_id: input.unit_id ?? null,
      resource_category_id: input.resource_category_id ?? null,
      source_company_item_id: null,
      source_unit_cost: null,
      source_updated_at: null,
      ignore_company_updates: false,
      created_by: access.ctx.profileId,
      updated_by: access.ctx.profileId,
    })
    .select('id')
    .single();

  if (error || !data) {
    return {
      success: false,
      error: error?.message ?? 'Failed to create project rate item.',
    };
  }

  try {
    await logAuditEvent({
      projectId: input.project_id,
      entityType: 'project_rate_library_item',
      entityId: data.id,
      action: 'project_rate.created',
      actorId: access.ctx.profileId,
      module: 'project_rate',
      newValue: `${code} — ${description}`,
      remarks: 'Created custom project rate resource',
      payload: {
        category: input.category,
        unit_cost: input.unit_cost,
      },
    });
  } catch (auditError) {
    console.error('[Project Rate Library] create audit failed', auditError);
  }

  return { success: true, itemId: data.id };
}
