'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ClipboardPaste,
  Plus,
  Search,
} from 'lucide-react';

import { ConnectivityBanner } from '@/components/connectivity/ConnectivityBanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableSkeleton } from '@/components/ui/skeleton';
import { WbsAddNodeDialog } from '@/features/wbs/components/WbsAddNodeDialog';
import { WbsBulkDeleteDialog } from '@/features/wbs/components/WbsBulkDeleteDialog';
import { WbsBulkToolbar } from '@/features/wbs/components/WbsBulkToolbar';
import { WbsDeleteDialog } from '@/features/wbs/components/WbsDeleteDialog';
import { WbsNodeBreadcrumb } from '@/features/wbs/components/WbsNodeBreadcrumb';
import { WbsTree, type WbsTreeHandle } from '@/features/wbs/components/WbsTree';
import { useBackgroundRefresh } from '@/hooks/useBackgroundRefresh';
import { WBS_SEARCH_DEBOUNCE_MS } from '@/lib/performance/constants';
import {
  collectLoadedDescendantIds,
  findNodeInMap,
  insertNodeIntoMap,
  moveNodeInMap,
  removeNodeFromMap,
  updateNodeInMap,
  type ChildrenMap,
} from '@/lib/wbs/tree-state';
import type { WbsDropPosition } from '@/types/wbs';
import {
  bulkDeleteWbsNodesAction,
  createWbsNodeAction,
  deleteWbsNodeAction,
  duplicateWbsBranchAction,
  fetchWbsBranchAction,
  getWbsAncestorsAction,
  getWbsDeleteImpactAction,
  loadWbsNodesAction,
  pasteWbsBranchAction,
  reparentWbsNodeAction,
  searchWbsNodesAction,
  updateWbsNodeAction,
} from '@/services/wbs/wbs-actions';
import type {
  WbsClipboardBranch,
  WbsNode,
  WbsNodePathSegment,
  WbsSearchResult,
} from '@/types/wbs';

interface WbsModuleProps {
  projectId: string;
  canEdit: boolean;
  initialRoots: WbsNode[];
}

interface AddDialogState {
  mode: 'root' | 'child';
  parentId?: string;
}

function buildVisibleRows(
  parentId: string | null,
  childrenMap: ChildrenMap,
  expandedIds: Set<string>,
  depth = 0
): Array<{ node: WbsNode; depth: number }> {
  const nodes = childrenMap.get(parentId) ?? [];
  const rows: Array<{ node: WbsNode; depth: number }> = [];

  for (const node of nodes) {
    rows.push({ node, depth });
    if (expandedIds.has(node.id)) {
      rows.push(
        ...buildVisibleRows(node.id, childrenMap, expandedIds, depth + 1)
      );
    }
  }

  return rows;
}

function createOptimisticNode(
  projectId: string,
  parentId: string | null,
  description: string,
  sortOrder: number
): WbsNode {
  return {
    id: `temp-${Date.now()}`,
    project_id: projectId,
    parent_id: parentId,
    level: parentId ? 2 : 1,
    wbs_code: '…',
    description,
    sort_order: sortOrder,
    child_count: 0,
    descendant_count: 0,
    boq_item_count: 0,
    has_children: false,
  };
}

export function WbsModule({
  projectId,
  canEdit,
  initialRoots,
}: WbsModuleProps): React.JSX.Element {
  const [childrenMap, setChildrenMap] = useState<ChildrenMap>(
    () => new Map([[null, initialRoots]])
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [loadingParentIds, setLoadingParentIds] = useState<Set<string>>(
    new Set()
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [lastCheckedId, setLastCheckedId] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<WbsNodePathSegment[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WbsSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimerRef = useRef<number | null>(null);
  const [clipboard, setClipboard] = useState<WbsClipboardBranch | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WbsNode | null>(null);
  const [deleteImpact, setDeleteImpact] = useState({
    childCount: 0,
    boqCount: 0,
  });
  const [isLoadingDeleteImpact, setIsLoadingDeleteImpact] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [addDialog, setAddDialog] = useState<AddDialogState | null>(null);
  const [addDescription, setAddDescription] = useState('');
  const treeRef = useRef<WbsTreeHandle>(null);

  const rows = useMemo(
    () => buildVisibleRows(null, childrenMap, expandedIds),
    [childrenMap, expandedIds]
  );

  const showStatus = useCallback((message: string) => {
    setStatusMessage(message);
    window.setTimeout(() => setStatusMessage(null), 2500);
  }, []);

  const refreshParent = useCallback(
    async (parentId: string | null) => {
      const nodes = await loadWbsNodesAction(projectId, parentId);
      setChildrenMap((current) => {
        const next = new Map(current);
        next.set(parentId, nodes);
        return next;
      });
      return nodes;
    },
    [projectId]
  );

  const refreshLoadedParents = useCallback(async () => {
    const parentIds = Array.from(childrenMap.keys());
    const refreshed = await Promise.all(
      parentIds.map((parentId) => loadWbsNodesAction(projectId, parentId))
    );
    setChildrenMap((current) => {
      const next = new Map(current);
      parentIds.forEach((parentId, index) => {
        next.set(parentId, refreshed[index] ?? []);
      });
      return next;
    });
  }, [childrenMap, projectId]);

  const loadChildren = useCallback(
    async (parentId: string) => {
      if (childrenMap.has(parentId) || loadingParentIds.has(parentId)) {
        return childrenMap.get(parentId) ?? [];
      }

      setLoadingParentIds((current) => new Set(current).add(parentId));
      const nodes = await loadWbsNodesAction(projectId, parentId);
      setChildrenMap((current) => {
        const next = new Map(current);
        next.set(parentId, nodes);
        return next;
      });
      setLoadingParentIds((current) => {
        const next = new Set(current);
        next.delete(parentId);
        return next;
      });
      return nodes;
    },
    [childrenMap, loadingParentIds, projectId]
  );

  const updateBreadcrumb = useCallback(
    async (nodeId: string | null) => {
      if (!nodeId) {
        setBreadcrumb([]);
        return;
      }
      const path = await getWbsAncestorsAction(projectId, nodeId);
      setBreadcrumb(path);
    },
    [projectId]
  );

  const handleSelect = useCallback(
    (nodeId: string, multi: boolean, range: boolean) => {
      setSelectedId(nodeId);
      void updateBreadcrumb(nodeId);

      setCheckedIds((current) => {
        const next = new Set(multi || range ? current : []);

        if (range && lastCheckedId) {
          const ids = rows.map((row) => row.node.id);
          const start = ids.indexOf(lastCheckedId);
          const end = ids.indexOf(nodeId);
          if (start !== -1 && end !== -1) {
            const [from, to] = start < end ? [start, end] : [end, start];
            for (let index = from; index <= to; index += 1) {
              next.add(ids[index]!);
            }
          } else {
            next.add(nodeId);
          }
        } else if (multi) {
          if (next.has(nodeId)) {
            next.delete(nodeId);
          } else {
            next.add(nodeId);
          }
        } else {
          next.clear();
          next.add(nodeId);
        }

        return next;
      });
      setLastCheckedId(nodeId);
    },
    [lastCheckedId, rows, updateBreadcrumb]
  );

  const handleToggleChecked = useCallback(
    (nodeId: string, _multi: boolean, range: boolean) => {
      setSelectedId(nodeId);
      void updateBreadcrumb(nodeId);

      setCheckedIds((current) => {
        const next = new Set(current);

        if (range && lastCheckedId) {
          const ids = rows.map((row) => row.node.id);
          const start = ids.indexOf(lastCheckedId);
          const end = ids.indexOf(nodeId);
          if (start !== -1 && end !== -1) {
            const [from, to] = start < end ? [start, end] : [end, start];
            for (let index = from; index <= to; index += 1) {
              next.add(ids[index]!);
            }
            return next;
          }
        }

        if (next.has(nodeId)) {
          next.delete(nodeId);
        } else {
          next.add(nodeId);
        }

        return next;
      });
      setLastCheckedId(nodeId);
    },
    [lastCheckedId, rows, updateBreadcrumb]
  );

  const handleToggleSelectAll = useCallback(
    (checked: boolean) => {
      if (!checked) {
        setCheckedIds(new Set());
        setLastCheckedId(null);
        return;
      }

      setCheckedIds(new Set(rows.map((row) => row.node.id)));
      setLastCheckedId(rows[rows.length - 1]?.node.id ?? null);
    },
    [rows]
  );

  const handleClearSelection = useCallback(() => {
    setCheckedIds(new Set());
    setLastCheckedId(null);
  }, []);

  const handleExpandSelected = useCallback(async () => {
    if (checkedIds.size === 0) {
      return;
    }

    setIsBusy(true);
    try {
      for (const nodeId of checkedIds) {
        await loadChildren(nodeId);
      }
      setExpandedIds((current) => {
        const next = new Set(current);
        for (const nodeId of checkedIds) {
          next.add(nodeId);
        }
        return next;
      });
    } finally {
      setIsBusy(false);
    }
  }, [checkedIds, loadChildren]);

  const handleCollapseSelected = useCallback(() => {
    if (checkedIds.size === 0) {
      return;
    }

    setExpandedIds((current) => {
      const next = new Set(current);
      for (const nodeId of checkedIds) {
        next.delete(nodeId);
      }
      return next;
    });
  }, [checkedIds]);

  const handleBulkDeleteRequest = useCallback(() => {
    if (checkedIds.size === 0) {
      return;
    }
    setBulkDeleteError(null);
    setBulkDeleteOpen(true);
  }, [checkedIds.size]);

  const handleBulkDeleteConfirm = useCallback(async () => {
    if (checkedIds.size === 0) {
      return;
    }

    const selected = Array.from(checkedIds);
    const preservedScrollTop = treeRef.current?.getScrollTop() ?? 0;
    const preservedExpanded = new Set(expandedIds);

    setIsBulkDeleting(true);
    setBulkDeleteError(null);

    let result: Awaited<ReturnType<typeof bulkDeleteWbsNodesAction>>;
    try {
      result = await bulkDeleteWbsNodesAction(projectId, selected);
    } catch (error) {
      setIsBulkDeleting(false);
      const message =
        error instanceof Error ? error.message : 'Bulk delete failed';
      setBulkDeleteError(message);
      showStatus(message);
      return;
    }

    if (!result.success) {
      setIsBulkDeleting(false);
      const message = result.error ?? 'Bulk delete failed';
      setBulkDeleteError(message);
      showStatus(message);
      return;
    }

    const deletedIds = new Set(result.deletedIds ?? selected);
    const deletedCount = result.deletedCount ?? deletedIds.size;

    setChildrenMap((current) => {
      let next = current;
      for (const id of deletedIds) {
        next = removeNodeFromMap(next, id);
      }
      return next;
    });

    setExpandedIds(() => {
      const next = new Set(preservedExpanded);
      for (const id of deletedIds) {
        next.delete(id);
      }
      return next;
    });

    setCheckedIds(new Set());
    setLastCheckedId(null);
    setBulkDeleteOpen(false);
    setIsBulkDeleting(false);

    if (selectedId && deletedIds.has(selectedId)) {
      setSelectedId(null);
      setBreadcrumb([]);
    }

    try {
      await refreshLoadedParents();
    } catch (error) {
      console.error('[WBS Bulk Delete] refresh failed', error);
    }

    requestAnimationFrame(() => {
      treeRef.current?.setScrollTop(preservedScrollTop);
    });

    showStatus(
      `${deletedCount} WBS item${deletedCount === 1 ? '' : 's'} deleted successfully.`
    );
  }, [
    checkedIds,
    expandedIds,
    projectId,
    refreshLoadedParents,
    selectedId,
    showStatus,
  ]);

  const handleToggleExpand = useCallback(
    async (nodeId: string) => {
      const isExpanded = expandedIds.has(nodeId);
      if (isExpanded) {
        setExpandedIds((current) => {
          const next = new Set(current);
          next.delete(nodeId);
          return next;
        });
        return;
      }

      await loadChildren(nodeId);
      setExpandedIds((current) => new Set(current).add(nodeId));
    },
    [expandedIds, loadChildren]
  );

  const handleExpandAll = useCallback(async () => {
    setIsBusy(true);
    const queue = [...(childrenMap.get(null) ?? [])];
    const visited = new Set<string>();
    const nextMap = new Map(childrenMap);

    while (queue.length > 0) {
      const node = queue.shift()!;
      if (visited.has(node.id)) {
        continue;
      }
      visited.add(node.id);
      const children = await loadWbsNodesAction(projectId, node.id);
      nextMap.set(node.id, children);
      queue.push(...children);
    }

    setChildrenMap(nextMap);
    setExpandedIds(new Set(visited));
    setIsBusy(false);
  }, [childrenMap, projectId]);

  const handleCollapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  const openAddRootDialog = useCallback(() => {
    setAddDescription('');
    setAddDialog({ mode: 'root' });
  }, []);

  const openAddChildDialog = useCallback((parentId: string) => {
    setAddDescription('');
    setAddDialog({ mode: 'child', parentId });
  }, []);

  const handleAddSubmit = useCallback(async () => {
    if (!addDialog || !addDescription.trim()) {
      return;
    }

    const parentId = addDialog.mode === 'child' ? addDialog.parentId ?? null : null;
    const description = addDescription.trim();
    const siblings = childrenMap.get(parentId) ?? [];
    const optimistic = createOptimisticNode(
      projectId,
      parentId,
      description,
      siblings.length
    );

    setChildrenMap((current) =>
      insertNodeIntoMap(current, parentId, optimistic, siblings.length)
    );
    setAddDialog(null);
    setIsBusy(true);

    const result = await createWbsNodeAction({
      project_id: projectId,
      parent_id: parentId ?? undefined,
      description,
    });
    setIsBusy(false);

    if (!result.success) {
      setChildrenMap((current) => removeNodeFromMap(current, optimistic.id));
      showStatus(result.error ?? 'Failed to add node');
      return;
    }

    if (parentId) {
      await refreshParent(parentId);
      setExpandedIds((current) => new Set(current).add(parentId));
    } else {
      await refreshParent(null);
    }

    if (result.nodeId) {
      setSelectedId(result.nodeId);
      void updateBreadcrumb(result.nodeId);
    }
    showStatus(addDialog.mode === 'root' ? 'Root level added' : 'Child node added');
  }, [
    addDescription,
    addDialog,
    childrenMap,
    projectId,
    refreshParent,
    showStatus,
    updateBreadcrumb,
  ]);

  const handleStartEdit = useCallback((node: WbsNode) => {
    setEditingId(node.id);
    setEditValue(node.description);
    setSelectedId(node.id);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingId || !editValue.trim()) {
      return;
    }

    const trimmed = editValue.trim();
    const previous = findNodeInMap(childrenMap, editingId);
    setChildrenMap((current) =>
      updateNodeInMap(current, editingId, { description: trimmed })
    );
    setEditingId(null);

    const result = await updateWbsNodeAction(projectId, editingId, {
      description: trimmed,
    });

    if (!result.success) {
      if (previous) {
        setChildrenMap((current) =>
          updateNodeInMap(current, editingId, { description: previous.description })
        );
      }
      showStatus(result.error ?? 'Failed to update node');
      return;
    }

    showStatus('Node updated');
  }, [childrenMap, editValue, editingId, projectId, showStatus]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditValue('');
  }, []);

  const handleDeleteRequest = useCallback(
    async (node: WbsNode) => {
      console.log('[WBS Delete] request started', {
        projectId,
        nodeId: node.id,
        wbs_code: node.wbs_code,
      });

      // Open dialog immediately so the click always produces UI feedback.
      setDeleteTarget(node);
      setDeleteError(null);
      setDeleteImpact({
        childCount: node.descendant_count,
        boqCount: node.boq_item_count,
      });
      setIsLoadingDeleteImpact(true);

      try {
        const impact = await getWbsDeleteImpactAction(projectId, node.id);

        console.log('[WBS Delete] impact response', impact);

        if (impact?.error) {
          setDeleteError(impact.error);
          showStatus(impact.error);
        }

        setDeleteImpact({
          childCount: impact?.childCount ?? node.descendant_count,
          boqCount: impact?.boqCount ?? node.boq_item_count,
        });
      } catch (error) {
        console.error('[WBS Delete] impact failed', error);
        const message =
          error instanceof Error
            ? error.message
            : 'Unable to check WBS delete impact.';
        setDeleteError(message);
        showStatus(message);
      } finally {
        setIsLoadingDeleteImpact(false);
      }
    },
    [projectId, showStatus]
  );

  const handleDeleteConfirm = useCallback(async () => {
    console.log('[WBS Delete] confirm handler entered', {
      hasTarget: Boolean(deleteTarget),
      deleteImpact,
    });

    if (!deleteTarget) {
      console.warn('[WBS Delete] confirm aborted — no deleteTarget');
      return;
    }

    if (deleteImpact.childCount > 0 || deleteImpact.boqCount > 0) {
      const message =
        'This WBS cannot be deleted because it contains child items.';
      console.warn('[WBS Delete] confirm blocked', deleteImpact);
      setDeleteError(message);
      showStatus(message);
      return;
    }

    const target = deleteTarget;
    const parentId = target.parent_id;
    const snapshot = childrenMap;
    const preservedScrollTop = treeRef.current?.getScrollTop() ?? 0;

    setDeleteError(null);
    setIsDeleting(true);

    console.log('[WBS Delete] before API call', {
      projectId,
      nodeId: target.id,
      wbs_code: target.wbs_code,
    });

    let result: Awaited<ReturnType<typeof deleteWbsNodeAction>>;
    try {
      result = await deleteWbsNodeAction(projectId, target.id);
    } catch (error) {
      setIsDeleting(false);
      const message =
        error instanceof Error ? error.message : 'Delete failed';
      console.error('[WBS Delete] API threw', error);
      setDeleteError(message);
      showStatus(message);
      return;
    }

    console.log('[WBS Delete] after API call', result);

    if (!result.success) {
      setIsDeleting(false);
      const message = result.error ?? 'Delete failed';
      console.error('[WBS Delete] API failed', message);
      setDeleteError(message);
      showStatus(message);
      return;
    }

    // Remove from UI only after confirmed success — preserve expand/collapse.
    setChildrenMap((current) => {
      let next = removeNodeFromMap(current, target.id);
      for (const descendantId of collectLoadedDescendantIds(
        current,
        target.id
      )) {
        if (descendantId !== target.id) {
          next = removeNodeFromMap(next, descendantId);
        }
      }
      return next;
    });

    setExpandedIds((current) => {
      const next = new Set(current);
      next.delete(target.id);
      for (const descendantId of collectLoadedDescendantIds(
        snapshot,
        target.id
      )) {
        next.delete(descendantId);
      }
      return next;
    });

    setDeleteTarget(null);
    setDeleteImpact({ childCount: 0, boqCount: 0 });
    setDeleteError(null);
    setIsDeleting(false);

    if (selectedId === target.id) {
      setSelectedId(null);
      setBreadcrumb([]);
    }

    console.log('[WBS Delete] refreshing parent siblings only', { parentId });

    try {
      await refreshParent(parentId);
    } catch (error) {
      console.error('[WBS Delete] tree refresh failed', error);
    }

    requestAnimationFrame(() => {
      treeRef.current?.setScrollTop(preservedScrollTop);
    });

    showStatus('WBS deleted successfully.');
  }, [
    childrenMap,
    deleteImpact,
    deleteTarget,
    projectId,
    refreshParent,
    selectedId,
    showStatus,
  ]);

  const handleCopy = useCallback(
    async (nodeId: string) => {
      const branch = await fetchWbsBranchAction(projectId, nodeId);
      if (!branch) {
        showStatus('Copy failed');
        return;
      }
      setClipboard(branch);
      showStatus('Branch copied');
    },
    [projectId, showStatus]
  );

  const handlePaste = useCallback(async () => {
    if (!clipboard) {
      showStatus('Nothing to paste');
      return;
    }

    const targetParentId = selectedId;
    setIsBusy(true);
    const result = await pasteWbsBranchAction(
      projectId,
      targetParentId,
      clipboard
    );
    setIsBusy(false);

    if (!result.success) {
      showStatus(result.error ?? 'Paste failed');
      return;
    }

    if (targetParentId) {
      await refreshParent(targetParentId);
      setExpandedIds((current) => new Set(current).add(targetParentId));
    }
    await refreshParent(null);
    showStatus('Branch pasted');
  }, [clipboard, projectId, refreshParent, selectedId, showStatus]);

  const handleDuplicate = useCallback(
    async (nodeId: string) => {
      setIsBusy(true);
      const result = await duplicateWbsBranchAction(projectId, nodeId);
      setIsBusy(false);

      if (!result.success) {
        showStatus(result.error ?? 'Duplicate failed');
        return;
      }

      await refreshLoadedParents();
      showStatus('Branch duplicated');
    },
    [projectId, refreshLoadedParents, showStatus]
  );

  const handleNavigateBreadcrumb = useCallback(
    (nodeId: string) => {
      setSelectedId(nodeId);
      void updateBreadcrumb(nodeId);
    },
    [updateBreadcrumb]
  );

  const handleSearchResultClick = useCallback(
    async (result: WbsSearchResult) => {
      for (const segment of result.path.slice(0, -1)) {
        await loadChildren(segment.id);
        setExpandedIds((current) => new Set(current).add(segment.id));
      }
      setSelectedId(result.id);
      setBreadcrumb(result.path);
      setSearchResults([]);
    },
    [loadChildren]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);

      if (searchTimerRef.current !== null) {
        window.clearTimeout(searchTimerRef.current);
      }

      if (!value.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      searchTimerRef.current = window.setTimeout(() => {
        void searchWbsNodesAction(projectId, value).then((results) => {
          setSearchResults(results);
          setIsSearching(false);
        });
      }, WBS_SEARCH_DEBOUNCE_MS);
    },
    [projectId]
  );

  const isDropForbidden = useCallback(
    (targetId: string) => {
      if (!draggingId) {
        return true;
      }
      if (draggingId === targetId) {
        return true;
      }
      return collectLoadedDescendantIds(childrenMap, draggingId).has(targetId);
    },
    [childrenMap, draggingId]
  );

  const handleDrop = useCallback(
    async (referenceNodeId: string, position: WbsDropPosition) => {
      if (!draggingId) {
        return;
      }

      const snapshot = childrenMap;
      let newParentId: string | null = null;
      let insertIndex = 0;

      if (position === 'inside') {
        newParentId = referenceNodeId;
        insertIndex = (childrenMap.get(newParentId) ?? []).filter(
          (node) => node.id !== draggingId
        ).length;
      } else {
        for (const [parentId, nodes] of childrenMap.entries()) {
          const referenceIndex = nodes.findIndex((node) => node.id === referenceNodeId);
          if (referenceIndex >= 0) {
            newParentId = parentId;
            const siblings = nodes.filter((node) => node.id !== draggingId);
            const adjustedIndex = siblings.findIndex((node) => node.id === referenceNodeId);
            insertIndex = position === 'before' ? adjustedIndex : adjustedIndex + 1;
            break;
          }
        }
      }

      setChildrenMap((current) =>
        moveNodeInMap(current, draggingId, newParentId, insertIndex)
      );
      setDraggingId(null);
      setIsBusy(true);

      const result = await reparentWbsNodeAction(
        projectId,
        draggingId,
        referenceNodeId,
        position
      );
      setIsBusy(false);

      if (!result.success) {
        setChildrenMap(snapshot);
        showStatus(result.error ?? 'Move failed');
        return;
      }

      await refreshLoadedParents();
      if (position === 'inside') {
        setExpandedIds((current) => new Set(current).add(referenceNodeId));
      }
      showStatus('Branch moved');
    },
    [childrenMap, draggingId, projectId, refreshLoadedParents, showStatus]
  );

  useEffect(() => {
    return () => {
      if (searchTimerRef.current !== null) {
        window.clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (!canEdit) {
        return;
      }

      if (event.key === 'Insert' && selectedId) {
        event.preventDefault();
        openAddChildDialog(selectedId);
      }

      if (event.key === 'F2' && selectedId) {
        event.preventDefault();
        const node = rows.find((row) => row.node.id === selectedId)?.node;
        if (node) {
          handleStartEdit(node);
        }
      }

      if (event.key === 'Delete') {
        event.preventDefault();
        if (checkedIds.size > 0) {
          handleBulkDeleteRequest();
          return;
        }
        if (selectedId) {
          const node = rows.find((row) => row.node.id === selectedId)?.node;
          if (node) {
            void handleDeleteRequest(node);
          }
        }
      }

      if (event.ctrlKey && event.key === 'c' && selectedId) {
        event.preventDefault();
        void handleCopy(selectedId);
      }

      if (event.ctrlKey && event.key === 'v') {
        event.preventDefault();
        void handlePaste();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    canEdit,
    checkedIds.size,
    handleBulkDeleteRequest,
    handleCopy,
    handleDeleteRequest,
    handlePaste,
    handleStartEdit,
    openAddChildDialog,
    rows,
    selectedId,
  ]);

  useBackgroundRefresh({
    onRefresh: () => {
      void refreshParent(null);
    },
  });

  return (
    <div>
      <ConnectivityBanner onRetry={() => void refreshParent(null)} />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <Button
              type="button"
              onClick={openAddRootDialog}
              disabled={isBusy}
            >
              <Plus className="h-4 w-4" />
              Add Root Level
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleExpandAll()}
            disabled={isBusy}
          >
            <ChevronDown className="h-4 w-4" />
            Expand All
          </Button>
          <Button type="button" variant="outline" onClick={handleCollapseAll}>
            <ChevronUp className="h-4 w-4" />
            Collapse All
          </Button>
          {canEdit && clipboard && (
            <Button
              type="button"
              variant="outline"
              onClick={() => void handlePaste()}
              disabled={isBusy}
            >
              <ClipboardPaste className="h-4 w-4" />
              Paste Branch
            </Button>
          )}
        </div>

        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search WBS code or description…"
            className="pl-9"
          />
          {isSearching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              …
            </span>
          )}
          {searchResults.length > 0 && (
            <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border bg-popover shadow-md">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => void handleSearchResultClick(result)}
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {result.wbs_code}
                  </span>
                  <span>{result.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {statusMessage && (
        <div
          className="mb-3 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm"
          role="status"
        >
          {statusMessage}
        </div>
      )}

      <WbsNodeBreadcrumb
        path={breadcrumb}
        onNavigate={handleNavigateBreadcrumb}
      />

      {isBusy && rows.length === 0 ? (
        <TableSkeleton rows={8} columns={5} />
      ) : (
        <WbsTree
          ref={treeRef}
          rows={rows}
          selectedId={selectedId}
          checkedIds={checkedIds}
          editingId={editingId}
          editValue={editValue}
          expandedIds={expandedIds}
          loadingParentIds={loadingParentIds}
          searchQuery={searchQuery}
          canEdit={canEdit}
          draggingId={draggingId}
          onSelect={handleSelect}
          onToggleChecked={handleToggleChecked}
          onToggleSelectAll={handleToggleSelectAll}
          onToggleExpand={(nodeId) => void handleToggleExpand(nodeId)}
          onStartEdit={handleStartEdit}
          onEditChange={setEditValue}
          onSaveEdit={() => void handleSaveEdit()}
          onCancelEdit={handleCancelEdit}
          onAddChild={openAddChildDialog}
          onDelete={(node) => void handleDeleteRequest(node)}
          onCopy={(nodeId) => void handleCopy(nodeId)}
          onDuplicate={(nodeId) => void handleDuplicate(nodeId)}
          onDragStart={setDraggingId}
          onDragEnd={() => setDraggingId(null)}
          onDrop={(nodeId, position) => void handleDrop(nodeId, position)}
          isDropForbidden={isDropForbidden}
        />
      )}

      <WbsBulkToolbar
        selectedCount={checkedIds.size}
        canEdit={canEdit}
        isBusy={isBusy || isBulkDeleting}
        onDeleteSelected={handleBulkDeleteRequest}
        onExpandSelected={() => void handleExpandSelected()}
        onCollapseSelected={handleCollapseSelected}
        onClearSelection={handleClearSelection}
      />

      {canEdit && rows.length === 0 && (
        <div className="mt-4">
          <Button type="button" onClick={openAddRootDialog}>
            <Plus className="h-4 w-4" />
            Add Root Level
          </Button>
        </div>
      )}

      <WbsAddNodeDialog
        open={addDialog !== null}
        title={addDialog?.mode === 'root' ? 'Add Root Level' : 'Add Child Node'}
        description={
          addDialog?.mode === 'root'
            ? 'Create a new Level 1 WBS node. Numbering is assigned automatically.'
            : 'Create a child under the selected node. Numbering is assigned automatically.'
        }
        value={addDescription}
        isSubmitting={isBusy}
        onChange={setAddDescription}
        onSubmit={() => void handleAddSubmit()}
        onCancel={() => setAddDialog(null)}
      />

      <WbsBulkDeleteDialog
        open={bulkDeleteOpen}
        selectedCount={checkedIds.size}
        isLoading={isBulkDeleting}
        error={bulkDeleteError}
        onConfirm={() => {
          void handleBulkDeleteConfirm();
        }}
        onCancel={() => {
          if (isBulkDeleting) {
            return;
          }
          setBulkDeleteOpen(false);
          setBulkDeleteError(null);
        }}
      />

      <WbsDeleteDialog
        open={deleteTarget !== null}
        wbsCode={deleteTarget?.wbs_code ?? ''}
        description={deleteTarget?.description ?? ''}
        childCount={deleteImpact.childCount}
        boqCount={deleteImpact.boqCount}
        isLoadingImpact={isLoadingDeleteImpact}
        isLoading={isDeleting}
        error={deleteError}
        onConfirm={() => {
          console.log('[WBS Delete] dialog onConfirm fired');
          void handleDeleteConfirm();
        }}
        onCancel={() => {
          if (isDeleting) {
            return;
          }
          setDeleteTarget(null);
          setDeleteImpact({ childCount: 0, boqCount: 0 });
          setDeleteError(null);
          setIsLoadingDeleteImpact(false);
        }}
      />

      {canEdit && (
        <p className="mt-4 text-xs text-muted-foreground">
          Shortcuts: Insert add child · F2 rename · Delete remove · Ctrl+C copy
          · Ctrl+V paste · Drag rows to move branches
        </p>
      )}
    </div>
  );
}
