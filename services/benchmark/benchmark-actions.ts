'use server';

import { revalidatePath } from 'next/cache';

import { calculateTotalAmount, calculateTotalRate } from '@/lib/boq/calculations';
import {
  parseCombinedCsv,
  parseExcelBuffer,
} from '@/lib/benchmark/import-parsers';
import { requireProvisionedUserProfile } from '@/lib/auth/session';
import { canManageCompanySettings } from '@/lib/auth/permissions';
import { ROUTES } from '@/lib/constants/routes';
import { createClient } from '@/lib/supabase/server';
import { createProject } from '@/services/projects/create-project';
import { createWbsNode } from '@/services/wbs/create-wbs-node';
import { createBoqItem } from '@/services/boq/create-boq-item';
import { refreshProjectEstimate } from '@/services/estimate/refresh-project-estimate';
import type { BenchmarkImportBundle } from '@/types/benchmark';

export interface ImportResult {
  ok: boolean;
  error?: string;
  projectId?: string;
  wbsCount?: number;
  boqCount?: number;
  actualsCount?: number;
}

async function parseImportFile(
  buffer: Buffer,
  filename: string
): Promise<BenchmarkImportBundle> {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.xlsx')) {
    return parseExcelBuffer(buffer);
  }
  return parseCombinedCsv(buffer.toString('utf8'));
}

export async function importBenchmarkProjectAction(
  formData: FormData
): Promise<ImportResult> {
  let profile;
  try {
    profile = await requireProvisionedUserProfile();
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unauthorized',
    };
  }

  if (!canManageCompanySettings(profile.role)) {
    return { ok: false, error: 'Admin access required for data import.' };
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return { ok: false, error: 'No file uploaded.' };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let bundle: BenchmarkImportBundle;

  try {
    bundle = await parseImportFile(buffer, file.name);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to parse import file.',
    };
  }

  if (bundle.boq.length === 0 && bundle.wbs.length === 0) {
    return { ok: false, error: 'Import file contains no WBS or BOQ rows.' };
  }

  const createResult = await createProject({
    project_name: bundle.metadata.project_name,
    client_name: bundle.metadata.client_name,
    location: bundle.metadata.location,
    description: bundle.metadata.description,
  });

  if (!createResult.success || !createResult.projectId) {
    return { ok: false, error: createResult.error ?? 'Failed to create project.' };
  }

  const projectId = createResult.projectId;
  const supabase = await createClient();

  if (bundle.metadata.is_benchmark) {
    await supabase
      .from('project_details')
      .update({ is_benchmark: true })
      .eq('project_id', projectId);
  }

  if (bundle.summary) {
    const updates: {
      indirect_cost_percent?: number;
      contingency_percent?: number;
      markup_percent?: number;
      vat_percent?: number;
    } = {};
    if (bundle.summary.indirect_cost_percent !== undefined) {
      updates.indirect_cost_percent = bundle.summary.indirect_cost_percent;
    }
    if (bundle.summary.contingency_percent !== undefined) {
      updates.contingency_percent = bundle.summary.contingency_percent;
    }
    if (bundle.summary.markup_percent !== undefined) {
      updates.markup_percent = bundle.summary.markup_percent;
    }
    if (bundle.summary.vat_percent !== undefined) {
      updates.vat_percent = bundle.summary.vat_percent;
    }
    if (Object.keys(updates).length > 0) {
      await supabase.from('project_details').update(updates).eq('project_id', projectId);
    }
  }

  const wbsCodeToId = new Map<string, string>();
  const sortedWbs = [...bundle.wbs].sort(
    (a, b) => a.wbs_code.split('.').length - b.wbs_code.split('.').length
  );

  for (const row of sortedWbs) {
    const parentId = row.parent_code
      ? wbsCodeToId.get(row.parent_code) ?? null
      : null;
    const result = await createWbsNode({
      project_id: projectId,
      parent_id: parentId,
      description: row.description,
    });
    if (result.success && result.nodeId) {
      wbsCodeToId.set(row.wbs_code, result.nodeId);
    }
  }

  if (wbsCodeToId.size === 0 && bundle.boq.length > 0) {
    const root = await createWbsNode({
      project_id: projectId,
      parent_id: null,
      description: 'Imported Works',
    });
    if (root.success && root.nodeId) {
      wbsCodeToId.set('1', root.nodeId);
    }
  }

  let boqCount = 0;
  let actualsCount = 0;
  const defaultWbsId = wbsCodeToId.values().next().value as string | undefined;

  for (const row of bundle.boq) {
    const wbsId = wbsCodeToId.get(row.wbs_code) ?? defaultWbsId;
    if (!wbsId) {
      continue;
    }

    const totalRate = calculateTotalRate({
      material_rate: row.material_rate,
      labor_rate: row.labor_rate,
      equipment_rate: row.equipment_rate,
      subcontract_rate: row.subcontract_rate,
      other_cost_rate: row.other_cost_rate ?? 0,
    });

    const result = await createBoqItem({
      project_id: projectId,
      wbs_id: wbsId,
      item_code: row.item_code,
      description: row.description,
      unit: row.unit,
      quantity: row.quantity,
      material_rate: row.material_rate,
      labor_rate: row.labor_rate,
      equipment_rate: row.equipment_rate,
      subcontract_rate: row.subcontract_rate,
      other_cost_rate: row.other_cost_rate ?? 0,
    });

    if (!result.success || !result.itemId) {
      continue;
    }

    boqCount += 1;

    const hasActuals =
      row.actual_quantity !== undefined ||
      row.actual_unit_rate !== undefined ||
      row.awarded_cost !== undefined;

    if (hasActuals) {
      const estimatedCost = calculateTotalAmount(row.quantity, totalRate);
      const actualQty = row.actual_quantity ?? row.quantity;
      const actualRate = row.actual_unit_rate ?? totalRate;
      const awarded = row.awarded_cost ?? calculateTotalAmount(actualQty, actualRate);

      await supabase.from('project_benchmark_actuals').insert({
        project_id: projectId,
        boq_item_id: result.itemId,
        item_code: row.item_code,
        description: row.description,
        estimated_quantity: row.quantity,
        actual_quantity: actualQty,
        estimated_unit_rate: totalRate,
        actual_unit_rate: actualRate,
        estimated_cost: estimatedCost,
        actual_cost: awarded,
        awarded_cost: awarded,
      });
      actualsCount += 1;
    }
  }

  await refreshProjectEstimate(projectId, profile.id);

  revalidatePath(ROUTES.adminBenchmarks);
  revalidatePath(ROUTES.projects);

  return {
    ok: true,
    projectId,
    wbsCount: wbsCodeToId.size,
    boqCount,
    actualsCount,
  };
}
