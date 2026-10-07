import { createClient } from '@/lib/supabase/server';
import type { MasterTemplateSnapshot } from '@/types/master-template';

export async function buildMasterTemplateSnapshot(
  projectId: string
): Promise<MasterTemplateSnapshot | null> {
  const supabase = await createClient();

  const { data: project } = await supabase
    .from('projects')
    .select(
      `
      id,
      project_name,
      client_name,
      location,
      project_details (
        building_type,
        contract_type,
        currency,
        assumptions,
        exclusions,
        commercial_notes,
        vat_percent,
        markup_percent,
        contingency_percent,
        indirect_cost_percent,
        project_type
      )
    `
    )
    .eq('id', projectId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!project) {
    return null;
  }

  const detailsRaw = Array.isArray(project.project_details)
    ? project.project_details[0]
    : project.project_details;

  const [{ data: wbs }, { data: resources }, { data: boq }] = await Promise.all([
    supabase
      .from('wbs')
      .select('id, parent_id, level, wbs_code, description, sort_order')
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('level', { ascending: true })
      .order('sort_order', { ascending: true }),
    supabase
      .from('project_rate_library_items')
      .select('id, code, description, unit, unit_cost, category')
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('code', { ascending: true }),
    supabase
      .from('boq_items')
      .select(
        'id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount'
      )
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('item_code', { ascending: true }),
  ]);

  const boqIds = (boq ?? []).map((row) => row.id);
  let rateAnalysis: MasterTemplateSnapshot['rate_analysis'] = [];
  if (boqIds.length > 0) {
    const { data: lines } = await supabase
      .from('boq_rate_analysis_lines')
      .select(
        'boq_item_id, project_library_item_id, library_item_id, category, resource_name, unit, consumption, unit_cost, waste_percent, productivity, amount, sort_order'
      )
      .in('boq_item_id', boqIds)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });
    rateAnalysis = (lines ?? []).map((line) => ({
      boq_item_id: line.boq_item_id,
      project_library_item_id: line.project_library_item_id,
      library_item_id: line.library_item_id,
      category: line.category,
      resource_name: line.resource_name,
      unit: line.unit,
      consumption: Number(line.consumption),
      unit_cost: Number(line.unit_cost),
      waste_percent: Number(line.waste_percent),
      productivity:
        line.productivity === null || line.productivity === undefined
          ? null
          : Number(line.productivity),
      amount: Number(line.amount),
      sort_order: Number(line.sort_order),
    }));
  }

  return {
    project_info: {
      project_name: project.project_name,
      client_name: project.client_name,
      location: project.location,
      building_type:
        (detailsRaw?.building_type as string | null) ??
        (detailsRaw?.project_type as string | null) ??
        null,
      contract_type: (detailsRaw?.contract_type as string | null) ?? null,
      currency: (detailsRaw?.currency as string | null) ?? 'PHP',
      assumptions: (detailsRaw?.assumptions as string | null) ?? null,
      exclusions: (detailsRaw?.exclusions as string | null) ?? null,
      commercial_notes: (detailsRaw?.commercial_notes as string | null) ?? null,
      vat_percent: Number(detailsRaw?.vat_percent ?? 12),
      markup_percent: Number(detailsRaw?.markup_percent ?? 10),
      contingency_percent: Number(detailsRaw?.contingency_percent ?? 5),
      indirect_cost_percent: Number(detailsRaw?.indirect_cost_percent ?? 10),
    },
    wbs: (wbs ?? []).map((row) => ({
      id: row.id,
      parent_id: row.parent_id,
      level: row.level,
      wbs_code: row.wbs_code,
      description: row.description,
      sort_order: row.sort_order,
    })),
    resources: (resources ?? []).map((row) => ({
      id: row.id,
      code: row.code,
      description: row.description,
      unit: row.unit,
      unit_cost: Number(row.unit_cost),
      category: row.category,
    })),
    boq: (boq ?? []).map((row) => ({
      id: row.id,
      wbs_id: row.wbs_id,
      item_code: row.item_code,
      description: row.description,
      unit: row.unit,
      quantity: Number(row.quantity),
      material_rate: Number(row.material_rate),
      labor_rate: Number(row.labor_rate),
      equipment_rate: Number(row.equipment_rate),
      subcontract_rate: Number(row.subcontract_rate),
      other_cost_rate: Number(row.other_cost_rate),
      total_rate: Number(row.total_rate),
      total_amount: Number(row.total_amount),
    })),
    rate_analysis: rateAnalysis,
  };
}
