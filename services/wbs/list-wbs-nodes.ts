import { getWbsTreeIndex } from '@/lib/cache/wbs-tree-index';
import { createClient } from '@/lib/supabase/server';
import type { WbsNode } from '@/types/wbs';
interface RawWbsRow {
  id: string;
  project_id: string;
  parent_id: string | null;
  level: number;
  wbs_code: string;
  description: string;
  sort_order: number;
}

async function attachNodeCounts(
  nodes: RawWbsRow[],
  projectId: string
): Promise<WbsNode[]> {
  if (nodes.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const nodeIds = nodes.map((node) => node.id);

  const [{ data: childRows }, { data: boqRows }, treeIndex] = await Promise.all([
    supabase
      .from('wbs')
      .select('parent_id')
      .in('parent_id', nodeIds)
      .is('deleted_at', null),
    supabase
      .from('boq_items')
      .select('wbs_id')
      .in('wbs_id', nodeIds)
      .is('deleted_at', null),
    getWbsTreeIndex(projectId),
  ]);

  const childCountMap = new Map<string, number>();
  for (const row of childRows ?? []) {
    if (!row.parent_id) {
      continue;
    }
    childCountMap.set(
      row.parent_id,
      (childCountMap.get(row.parent_id) ?? 0) + 1
    );
  }

  const boqCountMap = new Map<string, number>();
  for (const row of boqRows ?? []) {
    boqCountMap.set(row.wbs_id, (boqCountMap.get(row.wbs_id) ?? 0) + 1);
  }

  return nodes.map((node) => {
    const childCount = childCountMap.get(node.id) ?? 0;
    return {
      ...node,
      child_count: childCount,
      descendant_count: treeIndex.descendantCounts.get(node.id) ?? 0,
      boq_item_count: boqCountMap.get(node.id) ?? 0,
      has_children: childCount > 0,
    };
  });
}
export async function listWbsNodes(
  projectId: string,
  parentId: string | null
): Promise<WbsNode[]> {
  const supabase = await createClient();

  let query = supabase
    .from('wbs')
    .select(
      'id, project_id, parent_id, level, wbs_code, description, sort_order'
    )
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  query =
    parentId === null
      ? query.is('parent_id', null)
      : query.eq('parent_id', parentId);

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return attachNodeCounts((data ?? []) as RawWbsRow[], projectId);}

export async function countProjectWbsNodes(projectId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('wbs')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .is('deleted_at', null);

  if (error) {
    return 0;
  }

  return count ?? 0;
}
