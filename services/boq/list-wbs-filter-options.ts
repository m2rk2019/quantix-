import { createClient } from '@/lib/supabase/server';
import type { WbsFilterOption } from '@/types/boq';

export async function listWbsFilterOptions(
  projectId: string
): Promise<WbsFilterOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('wbs')
    .select('id, wbs_code, description, level, sort_order, parent_id')
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('level', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    wbs_code: row.wbs_code,
    description: row.description,
    level: row.level,
  }));
}
