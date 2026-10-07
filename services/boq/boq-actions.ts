'use server';

import { assertBoqReadAccess } from '@/services/boq/assert-boq-access';
import { createBoqItem } from '@/services/boq/create-boq-item';
import {
  deleteBoqItem,
  duplicateBoqItem,
} from '@/services/boq/delete-boq-item';
import {
  countProjectBoqItems,
  getBoqTotals,
  listBoqItems,
} from '@/services/boq/list-boq-items';
import { listWbsFilterOptions } from '@/services/boq/list-wbs-filter-options';
import { updateBoqItem } from '@/services/boq/update-boq-item';
import type {
  BoqClipboardRow,
  BoqListParams,
  BoqListResult,
  BoqTotals,
  CreateBoqItemInput,
  UpdateBoqItemInput,
  WbsFilterOption,
} from '@/types/boq';

export async function loadBoqItemsAction(
  projectId: string,
  params: BoqListParams
): Promise<BoqListResult> {
  const access = await assertBoqReadAccess(projectId);
  if (!access.ok) {
    return { items: [], total: 0, page: 1, pageSize: 200, totalPages: 1 };
  }
  return listBoqItems(projectId, params);
}

export async function loadWbsFilterOptionsAction(
  projectId: string
): Promise<WbsFilterOption[]> {
  const access = await assertBoqReadAccess(projectId);
  if (!access.ok) {
    return [];
  }
  return listWbsFilterOptions(projectId);
}

export async function loadBoqTotalsAction(
  projectId: string,
  wbsId?: string | null
): Promise<BoqTotals> {
  const access = await assertBoqReadAccess(projectId);
  if (!access.ok) {
    return {
      wbsSubtotal: 0,
      projectTotal: 0,
      categoryTotals: {
        materialTotal: 0,
        laborTotal: 0,
        equipmentTotal: 0,
        subcontractTotal: 0,
        grandTotal: 0,
      },
    };
  }
  return getBoqTotals(projectId, wbsId);
}

export async function createBoqItemAction(
  input: CreateBoqItemInput
): Promise<{ success: boolean; error?: string; itemId?: string }> {
  return createBoqItem(input);
}

export async function updateBoqItemAction(
  projectId: string,
  itemId: string,
  input: UpdateBoqItemInput
): Promise<{
  success: boolean;
  error?: string;
  item?: Awaited<ReturnType<typeof updateBoqItem>>['item'];
}> {
  return updateBoqItem(projectId, itemId, input);
}

export async function deleteBoqItemAction(
  projectId: string,
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  return deleteBoqItem(projectId, itemId);
}

export async function duplicateBoqItemAction(
  projectId: string,
  itemId: string
): Promise<{ success: boolean; error?: string; itemId?: string }> {
  return duplicateBoqItem(projectId, itemId);
}

export async function pasteBoqRowsAction(
  projectId: string,
  wbsId: string,
  rows: BoqClipboardRow[]
): Promise<{ success: boolean; error?: string; createdIds: string[] }> {
  const createdIds: string[] = [];

  for (const row of rows) {
    const result = await createBoqItem({
      project_id: projectId,
      wbs_id: wbsId,
      item_code: row.item_code || undefined,
      description: row.description,
      unit: row.unit,
      quantity: row.quantity,
      material_rate: row.material_rate,
      labor_rate: row.labor_rate,
      equipment_rate: row.equipment_rate,
      subcontract_rate: row.subcontract_rate,
      other_cost_rate: row.other_cost_rate,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error ?? 'Paste failed.',
        createdIds,
      };
    }

    if (result.itemId) {
      createdIds.push(result.itemId);
    }
  }

  return { success: true, createdIds };
}

export async function countProjectBoqItemsAction(
  projectId: string
): Promise<number> {
  const access = await assertBoqReadAccess(projectId);
  if (!access.ok) {
    return 0;
  }
  return countProjectBoqItems(projectId);
}
