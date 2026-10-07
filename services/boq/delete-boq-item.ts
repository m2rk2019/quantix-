import { revalidatePath } from 'next/cache';

import { ROUTES } from '@/lib/constants/routes';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/services/audit/log-audit-event';
import type { ActionResult } from '@/services/projects/create-project';
import { assertBoqEditAccess } from '@/services/boq/assert-boq-access';
import { refreshProjectEstimate } from '@/services/estimate/refresh-project-estimate';
import { createBoqItem } from '@/services/boq/create-boq-item';

export async function deleteBoqItem(
  projectId: string,
  itemId: string
): Promise<ActionResult> {
  const access = await assertBoqEditAccess(projectId);
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from('boq_items')
    .select('id, item_code, description')
    .eq('id', itemId)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .maybeSingle();

  if (fetchError || !existing) {
    return { success: false, error: 'BOQ item not found.' };
  }

  const { error } = await supabase
    .from('boq_items')
    .update({
      deleted_at: new Date().toISOString(),
      updated_by: access.ctx.profileId,
    })
    .eq('id', itemId);

  if (error) {
    return { success: false, error: error.message };
  }

  await logAuditEvent({
    projectId,
    entityType: 'boq_item',
    entityId: itemId,
    action: 'boq_item.deleted',
    actorId: access.ctx.profileId,
    module: 'boq',
    oldValue: `${existing.item_code} — ${existing.description}`,
    newValue: null,
    payload: { item_code: existing.item_code },
  });

  await refreshProjectEstimate(projectId, access.ctx.profileId);

  revalidatePath(ROUTES.projectBoq(projectId));
  revalidatePath(ROUTES.projectAudit(projectId));

  return { success: true };
}

export async function duplicateBoqItem(
  projectId: string,
  itemId: string
): Promise<ActionResult & { itemId?: string }> {
  const access = await assertBoqEditAccess(projectId);
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const supabase = await createClient();

  const { data: existing, error } = await supabase
    .from('boq_items')
    .select('*')
    .eq('id', itemId)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !existing) {
    return { success: false, error: 'BOQ item not found.' };
  }

  return createBoqItem({
    project_id: projectId,
    wbs_id: existing.wbs_id,
    description: `${existing.description} (Copy)`,
    unit: existing.unit,
    quantity: Number(existing.quantity),
    material_rate: Number(existing.material_rate),
    labor_rate: Number(existing.labor_rate),
    equipment_rate: Number(existing.equipment_rate),
    subcontract_rate: Number(existing.subcontract_rate),
    other_cost_rate: Number(existing.other_cost_rate ?? 0),
  });
}
