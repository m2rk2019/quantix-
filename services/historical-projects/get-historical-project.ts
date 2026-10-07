import { createClient } from '@/lib/supabase/server';
import type {
  HistoricalProjectDetail,
  HistoricalSnapshotRecord,
  HistoricalSnapshotSection,
} from '@/types/historical-project';
import { HISTORICAL_SNAPSHOT_SECTIONS } from '@/types/historical-project';

function isSection(value: string): value is HistoricalSnapshotSection {
  return (HISTORICAL_SNAPSHOT_SECTIONS as readonly string[]).includes(value);
}

export async function getHistoricalProjectById(
  historicalProjectId: string
): Promise<HistoricalProjectDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('historical_projects')
    .select('*')
    .eq('id', historicalProjectId)
    .eq('is_knowledge_active', true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const { data: snapshotRows } = await supabase
    .from('historical_project_snapshots')
    .select('section, payload, created_at')
    .eq('historical_project_id', historicalProjectId);

  const snapshots: HistoricalSnapshotRecord[] = (snapshotRows ?? [])
    .filter((row) => isSection(row.section))
    .map((row) => ({
      section: row.section as HistoricalSnapshotSection,
      payload: (row.payload ?? {}) as Record<string, unknown>,
      created_at: row.created_at,
    }));

  return {
    id: data.id,
    source_project_id: data.source_project_id,
    project_code: data.project_code,
    project_name: data.project_name,
    client_name: data.client_name,
    location: data.location,
    building_type: data.building_type,
    project_type: data.project_type,
    contract_type: data.contract_type,
    currency: data.currency,
    discipline_tags: data.discipline_tags ?? [],
    resource_tags: data.resource_tags ?? [],
    supplier_tags: data.supplier_tags ?? [],
    estimate_date: data.estimate_date,
    source_status: data.source_status,
    archive_version: data.archive_version,
    grand_total: Number(data.grand_total ?? 0),
    direct_cost: Number(data.direct_cost ?? 0),
    indirect_cost: Number(data.indirect_cost ?? 0),
    contingency: Number(data.contingency ?? 0),
    markup: Number(data.markup ?? 0),
    vat: Number(data.vat ?? 0),
    boq_item_count: Number(data.boq_item_count ?? 0),
    wbs_node_count: Number(data.wbs_node_count ?? 0),
    resource_count: Number(data.resource_count ?? 0),
    archived_at: data.archived_at,
    archived_by: data.archived_by,
    is_benchmark_eligible: Boolean(data.is_benchmark_eligible),
    cost_intelligence_ready: Boolean(data.cost_intelligence_ready),
    snapshots,
  };
}
