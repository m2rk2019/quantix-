import { createClient } from '@/lib/supabase/server';

export interface WbsTreeIndex {
  descendantCounts: Map<string, number>;
}

function buildDescendantCounts(
  nodes: Array<{ id: string; parent_id: string | null }>
): Map<string, number> {
  const childrenByParent = new Map<string | null, string[]>();

  for (const node of nodes) {
    const list = childrenByParent.get(node.parent_id) ?? [];
    list.push(node.id);
    childrenByParent.set(node.parent_id, list);
  }

  const memo = new Map<string, number>();

  function countDescendants(nodeId: string): number {
    const cached = memo.get(nodeId);
    if (cached !== undefined) {
      return cached;
    }

    const children = childrenByParent.get(nodeId) ?? [];
    const total = children.reduce(
      (sum, childId) => sum + 1 + countDescendants(childId),
      0
    );
    memo.set(nodeId, total);
    return total;
  }

  for (const node of nodes) {
    countDescendants(node.id);
  }

  return memo;
}

export async function getWbsTreeIndex(projectId: string): Promise<WbsTreeIndex> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('wbs')
    .select('id, parent_id')
    .eq('project_id', projectId)
    .is('deleted_at', null);

  if (error) {
    throw new Error(error.message);
  }

  return {
    descendantCounts: buildDescendantCounts(data ?? []),
  };
}
