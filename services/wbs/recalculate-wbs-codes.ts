import { assignCodesToSiblings } from '@/lib/wbs/codes';
import { createClient } from '@/lib/supabase/server';

interface WbsRow {
  id: string;
  wbs_code: string;
  parent_id: string | null;
  sort_order: number;
}

export async function recalculateWbsCodesForParent(
  projectId: string,
  parentId: string | null,
  profileId: string
): Promise<void> {
  const supabase = await createClient();

  let siblingsQuery = supabase
    .from('wbs')
    .select('id, wbs_code, parent_id, sort_order')
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  siblingsQuery =
    parentId === null
      ? siblingsQuery.is('parent_id', null)
      : siblingsQuery.eq('parent_id', parentId);

  const { data: siblings, error } = await siblingsQuery;

  if (error || !siblings || siblings.length === 0) {
    return;
  }

  let parentCode: string | null = null;
  if (parentId) {
    const { data: parent } = await supabase
      .from('wbs')
      .select('wbs_code')
      .eq('id', parentId)
      .is('deleted_at', null)
      .maybeSingle();
    parentCode = parent?.wbs_code ?? null;
  }

  const updates = assignCodesToSiblings(siblings as WbsRow[], parentCode);

  for (const update of updates) {
    await supabase
      .from('wbs')
      .update({
        wbs_code: update.wbs_code,
        sort_order: update.sort_order,
        updated_by: profileId,
      })
      .eq('id', update.id);

    await recalculateWbsCodesForParent(projectId, update.id, profileId);
  }
}

export async function recalculateEntireProjectWbsCodes(
  projectId: string,
  profileId: string
): Promise<void> {
  await recalculateWbsCodesForParent(projectId, null, profileId);
}
