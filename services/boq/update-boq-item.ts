import { revalidatePath } from 'next/cache';

import {
  calculateTotalAmount,
  calculateTotalRate,
  roundCurrency,
} from '@/lib/boq/calculations';
import { diffAuditFields } from '@/lib/audit/diff-fields';
import { BOQ_AUDIT_FIELDS, FIELD_LABELS, resolveBoqAction } from '@/lib/audit/constants';
import { ROUTES } from '@/lib/constants/routes';
import { createClient } from '@/lib/supabase/server';
import { logProjectAuditChanges } from '@/services/audit/log-audit-event';
import type { ActionResult } from '@/services/projects/create-project';
import { assertBoqEditAccess } from '@/services/boq/assert-boq-access';
import { refreshProjectEstimate } from '@/services/estimate/refresh-project-estimate';
import type { BoqItem, UpdateBoqItemInput } from '@/types/boq';

export type UpdateBoqItemResult = ActionResult & {
  item?: Pick<
    BoqItem,
    | 'id'
    | 'item_code'
    | 'description'
    | 'unit'
    | 'quantity'
    | 'material_rate'
    | 'labor_rate'
    | 'equipment_rate'
    | 'subcontract_rate'
    | 'other_cost_rate'
    | 'total_rate'
    | 'total_amount'
    | 'material_rate_override'
    | 'labor_rate_override'
    | 'equipment_rate_override'
    | 'subcontract_rate_override'
    | 'other_cost_rate_override'
    | 'updated_at'
  >;
};

export async function updateBoqItem(
  projectId: string,
  itemId: string,
  input: UpdateBoqItemInput
): Promise<UpdateBoqItemResult> {
  const access = await assertBoqEditAccess(projectId);
  if (!access.ok) {
    console.error('[BOQ UPDATE] access denied', { projectId, itemId, error: access.error });
    return { success: false, error: access.error };
  }

  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from('boq_items')
    .select('*')
    .eq('id', itemId)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .maybeSingle();

  if (fetchError) {
    console.error('[BOQ UPDATE] fetch error', fetchError);
    return { success: false, error: fetchError.message };
  }

  if (!existing) {
    console.error('[BOQ UPDATE] item not found', { projectId, itemId });
    return { success: false, error: 'BOQ item not found.' };
  }

  const description =
    input.description !== undefined
      ? input.description.trim()
      : existing.description;
  const unit =
    input.unit !== undefined ? input.unit.trim() : existing.unit;
  const itemCode =
    input.item_code !== undefined
      ? input.item_code.trim()
      : existing.item_code;

  if (!description) {
    return { success: false, error: 'Description is required.' };
  }

  if (!unit) {
    return { success: false, error: 'Unit is required.' };
  }

  if (!itemCode) {
    return { success: false, error: 'Item number is required.' };
  }

  const quantity = roundCurrency(
    input.quantity !== undefined ? input.quantity : Number(existing.quantity)
  );

  const rates = {
    material_rate: roundCurrency(
      input.material_rate !== undefined
        ? input.material_rate
        : Number(existing.material_rate)
    ),
    labor_rate: roundCurrency(
      input.labor_rate !== undefined
        ? input.labor_rate
        : Number(existing.labor_rate)
    ),
    equipment_rate: roundCurrency(
      input.equipment_rate !== undefined
        ? input.equipment_rate
        : Number(existing.equipment_rate)
    ),
    subcontract_rate: roundCurrency(
      input.subcontract_rate !== undefined
        ? input.subcontract_rate
        : Number(existing.subcontract_rate)
    ),
    other_cost_rate: roundCurrency(
      input.other_cost_rate !== undefined
        ? input.other_cost_rate
        : Number(existing.other_cost_rate ?? 0)
    ),
  };

  const numericFields = [
    { name: 'Quantity', value: quantity },
    ...Object.entries(rates).map(([key, value]) => ({
      name: key,
      value,
    })),
  ];

  for (const field of numericFields) {
    if (field.value < 0) {
      return {
        success: false,
        error: `${field.name} must be greater than or equal to 0.`,
      };
    }
  }

  if (input.wbs_id) {
    const { data: wbs } = await supabase
      .from('wbs')
      .select('id')
      .eq('id', input.wbs_id)
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .maybeSingle();

    if (!wbs) {
      return { success: false, error: 'WBS node not found.' };
    }
  }

  const totalRate = calculateTotalRate(rates);
  const totalAmount = calculateTotalAmount(quantity, totalRate);

  const overridePatch = {
    material_rate_override:
      input.material_rate_override ??
      (input.material_rate !== undefined
        ? true
        : (existing.material_rate_override ?? false)),
    labor_rate_override:
      input.labor_rate_override ??
      (input.labor_rate !== undefined
        ? true
        : (existing.labor_rate_override ?? false)),
    equipment_rate_override:
      input.equipment_rate_override ??
      (input.equipment_rate !== undefined
        ? true
        : (existing.equipment_rate_override ?? false)),
    subcontract_rate_override:
      input.subcontract_rate_override ??
      (input.subcontract_rate !== undefined
        ? true
        : (existing.subcontract_rate_override ?? false)),
    other_cost_rate_override:
      input.other_cost_rate_override ??
      (input.other_cost_rate !== undefined
        ? true
        : (existing.other_cost_rate_override ?? false)),
  };

  const payload = {
    wbs_id: input.wbs_id ?? existing.wbs_id,
    item_code: itemCode,
    description,
    unit,
    quantity,
    ...rates,
    ...overridePatch,
    total_rate: totalRate,
    total_amount: totalAmount,
    updated_by: access.ctx.profileId,
  };

  console.log('[BOQ UPDATE] executing', {
    projectId,
    itemId,
    primaryKey: itemId,
    changed: {
      item_code: itemCode,
      description,
      unit,
      quantity,
      ...rates,
    },
  });

  // .select() is required — RLS can silently update 0 rows without an error.
  const { data: updated, error } = await supabase
    .from('boq_items')
    .update(payload)
    .eq('id', itemId)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .select(
      `
        id,
        item_code,
        description,
        unit,
        quantity,
        material_rate,
        labor_rate,
        equipment_rate,
        subcontract_rate,
        other_cost_rate,
        total_rate,
        total_amount,
        material_rate_override,
        labor_rate_override,
        equipment_rate_override,
        subcontract_rate_override,
        other_cost_rate_override,
        updated_at
      `
    )
    .maybeSingle();

  if (error) {
    console.error('[BOQ UPDATE] supabase error', error);
    return { success: false, error: error.message };
  }

  if (!updated) {
    console.error(
      '[BOQ UPDATE] 0 rows updated — likely RLS WITH CHECK/USING blocked the write',
      { projectId, itemId }
    );
    return {
      success: false,
      error:
        'Update blocked by database permissions (RLS). No rows were updated. Apply the BOQ update RLS migration.',
    };
  }

  console.log('[BOQ UPDATE] success', {
    itemId: updated.id,
    item_code: updated.item_code,
    quantity: updated.quantity,
    total_amount: updated.total_amount,
  });

  const afterState = {
    quantity,
    ...rates,
    description,
    unit,
    item_code: itemCode,
    wbs_id: input.wbs_id ?? existing.wbs_id,
  };

  const beforeState: Record<string, unknown> = {
    quantity: Number(existing.quantity),
    material_rate: Number(existing.material_rate),
    labor_rate: Number(existing.labor_rate),
    equipment_rate: Number(existing.equipment_rate),
    subcontract_rate: Number(existing.subcontract_rate),
    other_cost_rate: Number(existing.other_cost_rate ?? 0),
    description: existing.description,
    unit: existing.unit,
    item_code: existing.item_code,
    wbs_id: existing.wbs_id,
  };

  const fieldChanges = diffAuditFields(beforeState, afterState, BOQ_AUDIT_FIELDS);

  if (fieldChanges.some((change) => change.field === 'wbs_id')) {
    const wbsIds = [existing.wbs_id, afterState.wbs_id as string];
    const { data: wbsRows } = await supabase
      .from('wbs')
      .select('id, wbs_code')
      .in('id', wbsIds);

    const codeById = new Map(
      (wbsRows ?? []).map((row) => [row.id, row.wbs_code])
    );

    for (const change of fieldChanges) {
      if (change.field === 'wbs_id') {
        change.oldValue = codeById.get(existing.wbs_id) ?? change.oldValue;
        change.newValue =
          codeById.get(afterState.wbs_id as string) ?? change.newValue;
      }
    }
  }

  await logProjectAuditChanges({
    projectId,
    entityType: 'boq_item',
    entityId: itemId,
    actorId: access.ctx.profileId,
    module: 'boq',
    payload: { item_code: itemCode },
    changes: fieldChanges.map((change) => ({
      action: resolveBoqAction(change.field),
      field: change.field,
      oldValue: change.oldValue,
      newValue: change.newValue,
      remarks: FIELD_LABELS[change.field] ?? change.field,
    })),
  });

  try {
    await refreshProjectEstimate(projectId, access.ctx.profileId);
  } catch (estimateError) {
    console.error('[BOQ UPDATE] estimate refresh failed (non-fatal)', estimateError);
  }

  revalidatePath(ROUTES.projectAudit(projectId));

  return {
    success: true,
    item: {
      id: updated.id,
      item_code: updated.item_code,
      description: updated.description,
      unit: updated.unit,
      quantity: Number(updated.quantity),
      material_rate: Number(updated.material_rate),
      labor_rate: Number(updated.labor_rate),
      equipment_rate: Number(updated.equipment_rate),
      subcontract_rate: Number(updated.subcontract_rate),
      other_cost_rate: Number(updated.other_cost_rate ?? 0),
      total_rate: Number(updated.total_rate),
      total_amount: Number(updated.total_amount),
      material_rate_override: Boolean(updated.material_rate_override),
      labor_rate_override: Boolean(updated.labor_rate_override),
      equipment_rate_override: Boolean(updated.equipment_rate_override),
      subcontract_rate_override: Boolean(updated.subcontract_rate_override),
      other_cost_rate_override: Boolean(updated.other_cost_rate_override),
      updated_at: updated.updated_at,
    },
  };
}
