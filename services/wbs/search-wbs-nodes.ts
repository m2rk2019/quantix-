import { createClient } from '@/lib/supabase/server';
import { assertWbsReadAccess } from '@/services/wbs/assert-wbs-access';
import type { WbsSearchResult } from '@/types/wbs';

export async function searchWbsNodes(
  projectId: string,
  query: string
): Promise<WbsSearchResult[]> {
  const access = await assertWbsReadAccess(projectId);
  if (!access.ok || !query.trim()) {
    return [];
  }

  const supabase = await createClient();
  const term = query.trim();

  const { data: matches, error } = await supabase
    .from('wbs')
    .select('id, wbs_code, description, level, parent_id')
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .or(`wbs_code.ilike.%${term}%,description.ilike.%${term}%`)
    .order('wbs_code', { ascending: true })
    .limit(50);

  if (error || !matches) {
    return [];
  }

  const { data: allNodes } = await supabase
    .from('wbs')
    .select('id, parent_id, wbs_code, description')
    .eq('project_id', projectId)
    .is('deleted_at', null);

  const nodeMap = new Map((allNodes ?? []).map((node) => [node.id, node]));

  return matches.map((match) => {
    const path: WbsSearchResult['path'] = [];
    let currentId: string | null = match.id;

    while (currentId) {
      const current = nodeMap.get(currentId);
      if (!current) {
        break;
      }
      path.unshift({
        id: current.id,
        wbs_code: current.wbs_code,
        description: current.description,
      });
      currentId = current.parent_id;
    }

    return {
      id: match.id,
      wbs_code: match.wbs_code,
      description: match.description,
      level: match.level,
      parent_id: match.parent_id,
      path,
    };
  });
}
