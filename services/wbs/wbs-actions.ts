'use server';

import { createWbsNode } from '@/services/wbs/create-wbs-node';
import {
  bulkDeleteWbsNodes,
  type BulkDeleteWbsResult,
} from '@/services/wbs/bulk-delete-wbs-nodes';
import { deleteWbsNode, getWbsDeleteImpact } from '@/services/wbs/delete-wbs-node';
import { duplicateWbsBranch, pasteWbsBranch } from '@/services/wbs/paste-wbs-branch';
import { fetchWbsBranch } from '@/services/wbs/fetch-wbs-branch';
import { getWbsAncestors } from '@/services/wbs/get-wbs-ancestors';
import { listWbsNodes } from '@/services/wbs/list-wbs-nodes';
import { moveWbsNode } from '@/services/wbs/move-wbs-node';
import { reparentWbsNode } from '@/services/wbs/reparent-wbs-node';
import { searchWbsNodes } from '@/services/wbs/search-wbs-nodes';
import { updateWbsNode } from '@/services/wbs/update-wbs-node';
import { assertWbsReadAccess } from '@/services/wbs/assert-wbs-access';
import type {
  CreateWbsNodeInput,
  UpdateWbsNodeInput,
  WbsClipboardBranch,
  WbsNode,
  WbsNodePathSegment,
  WbsSearchResult,
} from '@/types/wbs';

export async function loadWbsNodesAction(
  projectId: string,
  parentId: string | null
): Promise<WbsNode[]> {
  const access = await assertWbsReadAccess(projectId);
  if (!access.ok) {
    return [];
  }
  return listWbsNodes(projectId, parentId);
}

export async function searchWbsNodesAction(
  projectId: string,
  query: string
): Promise<WbsSearchResult[]> {
  return searchWbsNodes(projectId, query);
}

export async function getWbsAncestorsAction(
  projectId: string,
  nodeId: string
): Promise<WbsNodePathSegment[]> {
  return getWbsAncestors(projectId, nodeId);
}

export async function createWbsNodeAction(
  input: CreateWbsNodeInput
): Promise<{ success: boolean; error?: string; nodeId?: string }> {
  return createWbsNode(input);
}

export async function updateWbsNodeAction(
  projectId: string,
  nodeId: string,
  input: UpdateWbsNodeInput
): Promise<{ success: boolean; error?: string }> {
  return updateWbsNode(projectId, nodeId, input);
}

export async function deleteWbsNodeAction(
  projectId: string,
  nodeId: string
): Promise<{
  success: boolean;
  error?: string;
  childCount?: number;
  boqCount?: number;
}> {
  return deleteWbsNode(projectId, nodeId);
}

export async function bulkDeleteWbsNodesAction(
  projectId: string,
  nodeIds: string[]
): Promise<BulkDeleteWbsResult> {
  return bulkDeleteWbsNodes(projectId, nodeIds);
}

export async function getWbsDeleteImpactAction(
  projectId: string,
  nodeId: string
): Promise<{ childCount: number; boqCount: number; error?: string } | null> {
  return getWbsDeleteImpact(projectId, nodeId);
}

export async function moveWbsNodeAction(
  projectId: string,
  nodeId: string,
  direction: 'up' | 'down'
): Promise<{ success: boolean; error?: string }> {
  return moveWbsNode(projectId, nodeId, direction);
}

export async function reparentWbsNodeAction(
  projectId: string,
  nodeId: string,
  referenceNodeId: string | null,
  position: 'before' | 'after' | 'inside'
): Promise<{ success: boolean; error?: string }> {
  return reparentWbsNode(projectId, nodeId, referenceNodeId, position);
}

export async function fetchWbsBranchAction(
  projectId: string,
  nodeId: string
): Promise<WbsClipboardBranch | null> {
  const access = await assertWbsReadAccess(projectId);
  if (!access.ok) {
    return null;
  }
  return fetchWbsBranch(projectId, nodeId);
}

export async function pasteWbsBranchAction(
  projectId: string,
  targetParentId: string | null,
  branch: WbsClipboardBranch
): Promise<{ success: boolean; error?: string; rootNodeId?: string }> {
  return pasteWbsBranch(projectId, targetParentId, branch);
}

export async function duplicateWbsBranchAction(
  projectId: string,
  nodeId: string
): Promise<{ success: boolean; error?: string; rootNodeId?: string }> {
  return duplicateWbsBranch(projectId, nodeId);
}
