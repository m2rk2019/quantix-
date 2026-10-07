import type { WbsClipboardBranch } from '@/types/wbs';

export interface WbsSiblingRef {
  id: string;
  wbs_code: string;
  parent_id: string | null;
  sort_order: number;
}

export function buildWbsCode(
  parentCode: string | null,
  siblingIndex: number
): string {
  const segment = String(siblingIndex);
  return parentCode ? `${parentCode}.${segment}` : segment;
}

export function assignCodesToSiblings(
  siblings: WbsSiblingRef[],
  parentCode: string | null
): Array<{ id: string; wbs_code: string; sort_order: number }> {
  return siblings.map((node, index) => ({
    id: node.id,
    wbs_code: buildWbsCode(parentCode, index + 1),
    sort_order: index,
  }));
}

export function flattenClipboardBranch(
  branch: WbsClipboardBranch
): WbsClipboardBranch[] {
  const nodes: WbsClipboardBranch[] = [branch];
  for (const child of branch.children) {
    nodes.push(...flattenClipboardBranch(child));
  }
  return nodes;
}

export function countClipboardNodes(branch: WbsClipboardBranch): number {
  return 1 + branch.children.reduce((sum, child) => sum + countClipboardNodes(child), 0);
}
