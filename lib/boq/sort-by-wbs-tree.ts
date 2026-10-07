/**
 * Build DFS display order matching the WBS left-panel tree
 * (siblings ordered by sort_order under each parent).
 */
export function buildWbsTreeDisplayOrder(
  nodes: Array<{
    id: string;
    parent_id: string | null;
    sort_order: number;
  }>
): Map<string, number> {
  const childrenByParent = new Map<string | null, typeof nodes>();

  for (const node of nodes) {
    const key = node.parent_id;
    const list = childrenByParent.get(key) ?? [];
    list.push(node);
    childrenByParent.set(key, list);
  }

  for (const [, siblings] of childrenByParent) {
    siblings.sort((a, b) => a.sort_order - b.sort_order);
  }

  const displayOrder = new Map<string, number>();
  let index = 0;

  function walk(parentId: string | null): void {
    const children = childrenByParent.get(parentId) ?? [];
    for (const child of children) {
      displayOrder.set(child.id, index);
      index += 1;
      walk(child.id);
    }
  }

  walk(null);
  return displayOrder;
}

/**
 * Sort BOQ rows: WBS tree display order, then import sequence within node.
 * Within-node sequence uses created_at (import insert order), not item_code/id.
 */
export function compareBoqByWbsTreeOrder<
  T extends { wbs_id: string; created_at: string },
>(
  a: T,
  b: T,
  wbsDisplayOrder: Map<string, number>
): number {
  const orderA = wbsDisplayOrder.get(a.wbs_id) ?? Number.MAX_SAFE_INTEGER;
  const orderB = wbsDisplayOrder.get(b.wbs_id) ?? Number.MAX_SAFE_INTEGER;
  if (orderA !== orderB) {
    return orderA - orderB;
  }
  if (a.created_at < b.created_at) return -1;
  if (a.created_at > b.created_at) return 1;
  return 0;
}
