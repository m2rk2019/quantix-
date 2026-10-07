import { revalidatePath } from 'next/cache';

import {
  calculateTotalAmount,
  calculateTotalRate,
  roundCurrency,
} from '@/lib/boq/calculations';
import { generateBoqItemCode } from '@/lib/boq/item-code';
import { ROUTES } from '@/lib/constants/routes';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/services/audit/log-audit-event';
import type { ActionResult } from '@/services/projects/create-project';
import { assertBoqEditAccess } from '@/services/boq/assert-boq-access';
import { refreshProjectEstimate } from '@/services/estimate/refresh-project-estimate';
import type { CreateBoqItemInput } from '@/types/boq';

function validateRates(input: CreateBoqItemInput): string | null {
  const fields = [
    { name: 'Quantity', value: input.quantity ?? 0 },
    { name: 'Material rate', value: input.material_rate ?? 0 },
    { name: 'Labor rate', value: input.labor_rate ?? 0 },
    { name: 'Equipment rate', value: input.equipment_rate ?? 0 },
    { name: 'Subcontract rate', value: input.subcontract_rate ?? 0 },
    { name: 'Other cost rate', value: input.other_cost_rate ?? 0 },
  ];

  for (const field of fields) {
    if (field.value < 0) {
      return `${field.name} must be greater than or equal to 0.`;
    }
  }

  return null;
}

export async function createBoqItem(
  input: CreateBoqItemInput
): Promise<ActionResult & { itemId?: string }> {
  const access = await assertBoqEditAccess(input.project_id);
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const rateError = validateRates(input);
  if (rateError) {
    return { success: false, error: rateError };
  }

  const description = (input.description ?? '').trim();
  const unit = (input.unit ?? 'item').trim();

  if (!description) {
    return { success: false, error: 'Description is required.' };
  }

  if (!unit) {
    return { success: false, error: 'Unit is required.' };
  }

  const supabase = await createClient();

  const { data: wbs } = await supabase
    .from('wbs')
    .select('id')
    .eq('id', input.wbs_id)
    .eq('project_id', input.project_id)
    .is('deleted_at', null)
    .maybeSingle();

  if (!wbs) {
    return { success: false, error: 'WBS node not found.' };
  }

  const itemCode =
    input.item_code?.trim() || (await generateBoqItemCode(input.project_id));

  const rates = {
    material_rate: roundCurrency(input.material_rate ?? 0),
    labor_rate: roundCurrency(input.labor_rate ?? 0),
    equipment_rate: roundCurrency(input.equipment_rate ?? 0),
    subcontract_rate: roundCurrency(input.subcontract_rate ?? 0),
    other_cost_rate: roundCurrency(input.other_cost_rate ?? 0),
  };

  const quantity = roundCurrency(input.quantity ?? 0);
  const totalRate = calculateTotalRate(rates);
  const totalAmount = calculateTotalAmount(quantity, totalRate);

  const { data: item, error } = await supabase
    .from('boq_items')
    .insert({
      project_id: input.project_id,
      wbs_id: input.wbs_id,
      item_code: itemCode,
      description,
      unit,
      quantity,
      ...rates,
      total_rate: totalRate,
      total_amount: totalAmount,
      created_by: access.ctx.profileId,
      updated_by: access.ctx.profileId,
    })
    .select('id')
    .single();

  if (error || !item) {
    return { success: false, error: error?.message ?? 'Failed to create item.' };
  }

  await logAuditEvent({
    projectId: input.project_id,
    entityType: 'boq_item',
    entityId: item.id,
    action: 'boq_item.created',
    actorId: access.ctx.profileId,
    module: 'boq',
    oldValue: null,
    newValue: `${itemCode} — ${description}`,
    remarks: `Qty ${quantity}, Unit ${unit}, Amount ${totalAmount.toFixed(2)}`,
    payload: { item_code: itemCode },
  });

  await refreshProjectEstimate(input.project_id, access.ctx.profileId);

  revalidatePath(ROUTES.projectBoq(input.project_id));
  revalidatePath(ROUTES.projectAudit(input.project_id));

  return { success: true, itemId: item.id };
}
