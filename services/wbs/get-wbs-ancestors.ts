import { createClient } from '@/lib/supabase/server';
import { assertWbsReadAccess } from '@/services/wbs/assert-wbs-access';
import type { WbsNodePathSegment } from '@/types/wbs';

export async function getWbsAncestors(
  projectId: string,
  nodeId: string
): Promise<WbsNodePathSegment[]> {
  const access = await assertWbsReadAccess(projectId);
  if (!access.ok) {
    return [];
  }

  const supabase = await createClient();

  const { data: allNodes } = await supabase
    .from('wbs')
    .select('id, parent_id, wbs_code, description')
    .eq('project_id', projectId)
    .is('deleted_at', null);

  if (!allNodes) {
    return [];
  }

  const nodeMap = new Map(allNodes.map((node) => [node.id, node]));
  const path: WbsNodePathSegment[] = [];

  let currentId: string | null = nodeId;
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

  return path;
}
