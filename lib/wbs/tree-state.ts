import type { WbsNode } from '@/types/wbs';

export type ChildrenMap = Map<string | null, WbsNode[]>;

export function findNodeParentId(
  childrenMap: ChildrenMap,
  nodeId: string
): string | null {
  for (const [parentId, nodes] of childrenMap.entries()) {
    if (nodes.some((node) => node.id === nodeId)) {
      return parentId;
    }
  }
  return null;
}

export function findNodeInMap(
  childrenMap: ChildrenMap,
  nodeId: string
): WbsNode | null {
  for (const nodes of childrenMap.values()) {
    const match = nodes.find((node) => node.id === nodeId);
    if (match) {
      return match;
    }
  }
  return null;
}

export function updateNodeInMap(
  childrenMap: ChildrenMap,
  nodeId: string,
  patch: Partial<WbsNode>
): ChildrenMap {
  const next = new Map(childrenMap);
  for (const [parentId, nodes] of next.entries()) {
    next.set(
      parentId,
      nodes.map((node) => (node.id === nodeId ? { ...node, ...patch } : node))
    );
  }
  return next;
}

export function removeNodeFromMap(
  childrenMap: ChildrenMap,
  nodeId: string
): ChildrenMap {
  const next = new Map(childrenMap);
  for (const [parentId, nodes] of next.entries()) {
    next.set(
      parentId,
      nodes.filter((node) => node.id !== nodeId)
    );
  }
  next.delete(nodeId);
  return next;
}

export function insertNodeIntoMap(
  childrenMap: ChildrenMap,
  parentId: string | null,
  node: WbsNode,
  index?: number
): ChildrenMap {
  const next = new Map(childrenMap);
  const siblings = [...(next.get(parentId) ?? [])];
  const targetIndex = index ?? siblings.length;
  siblings.splice(targetIndex, 0, node);
  next.set(parentId, siblings);
  return next;
}

export function moveNodeInMap(
  childrenMap: ChildrenMap,
  nodeId: string,
  newParentId: string | null,
  index: number
): ChildrenMap {
  const node = findNodeInMap(childrenMap, nodeId);
  if (!node) {
    return childrenMap;
  }

  const without = removeNodeFromMap(childrenMap, nodeId);
  return insertNodeIntoMap(without, newParentId, { ...node, parent_id: newParentId }, index);
}

export function collectLoadedDescendantIds(
  childrenMap: ChildrenMap,
  nodeId: string
): Set<string> {
  const result = new Set<string>();
  const stack = [nodeId];

  while (stack.length > 0) {
    const current = stack.pop()!;
    result.add(current);
    for (const child of childrenMap.get(current) ?? []) {
      stack.push(child.id);
    }
  }

  return result;
}

export function nodeMatchesSearch(node: WbsNode, query: string): boolean {
  const term = query.trim().toLowerCase();
  if (!term) {
    return false;
  }
  return (
    node.wbs_code.toLowerCase().includes(term) ||
    node.description.toLowerCase().includes(term)
  );
}
