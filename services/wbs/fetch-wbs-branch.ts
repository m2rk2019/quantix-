import { createClient } from '@/lib/supabase/server';
import type { WbsClipboardBranch } from '@/types/wbs';

interface WbsDbRow {
  id: string;
  parent_id: string | null;
  description: string;
}

export async function fetchWbsBranch(
  projectId: string,
  nodeId: string
): Promise<WbsClipboardBranch | null> {
  const supabase = await createClient();

  const { data: allNodes } = await supabase
    .from('wbs')
    .select('id, parent_id, description')
    .eq('project_id', projectId)
    .is('deleted_at', null);

  if (!allNodes) {
    return null;
  }

  const nodeMap = new Map<string, WbsDbRow>(
    allNodes.map((node) => [node.id, node])
  );

  if (!nodeMap.has(nodeId)) {
    return null;
  }

  const childrenByParent = new Map<string | null, WbsDbRow[]>();
  for (const node of allNodes) {
    const key = node.parent_id;
    const list = childrenByParent.get(key) ?? [];
    list.push(node);
    childrenByParent.set(key, list);
  }

  function build(node: WbsDbRow): WbsClipboardBranch {
    const children = childrenByParent.get(node.id) ?? [];
    return {
      description: node.description,
      children: children.map(build),
    };
  }

  return build(nodeMap.get(nodeId)!);
}
