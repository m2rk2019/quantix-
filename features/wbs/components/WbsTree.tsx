'use client';

import {
  ChevronDown,
  ChevronRight,
  Copy,
  CopyPlus,
  Folder,
  FolderOpen,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WBS_ROW_HEIGHT } from '@/lib/performance/constants';
import { nodeMatchesSearch } from '@/lib/wbs/tree-state';
import { cn } from '@/lib/utils';
import type { WbsDropPosition } from '@/types/wbs';
import type { WbsNode } from '@/types/wbs';

interface VisibleWbsRow {
  node: WbsNode;
  depth: number;
}

interface DropIndicator {
  nodeId: string;
  position: WbsDropPosition;
}

export interface WbsTreeHandle {
  getScrollTop: () => number;
  setScrollTop: (value: number) => void;
}

interface WbsTreeProps {
  rows: VisibleWbsRow[];
  selectedId: string | null;
  checkedIds: Set<string>;
  editingId: string | null;
  editValue: string;
  expandedIds: Set<string>;
  loadingParentIds: Set<string>;
  searchQuery: string;
  canEdit: boolean;
  draggingId: string | null;
  onSelect: (nodeId: string, multi: boolean, range: boolean) => void;
  onToggleChecked: (nodeId: string, multi: boolean, range: boolean) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onToggleExpand: (nodeId: string) => void;
  onStartEdit: (node: WbsNode) => void;
  onEditChange: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onAddChild: (nodeId: string) => void;
  onDelete: (node: WbsNode) => void;
  onCopy: (nodeId: string) => void;
  onDuplicate: (nodeId: string) => void;
  onDragStart: (nodeId: string) => void;
  onDragEnd: () => void;
  onDrop: (nodeId: string, position: WbsDropPosition) => void;
  isDropForbidden: (nodeId: string) => boolean;
}

interface WbsTreeRowProps {
  row: VisibleWbsRow;
  isFocused: boolean;
  isChecked: boolean;
  isEditing: boolean;
  isExpanded: boolean;
  isLoading: boolean;
  isSearchMatch: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  dropPosition: WbsDropPosition | null;
  editValue: string;
  canEdit: boolean;
  onSelect: (nodeId: string, multi: boolean, range: boolean) => void;
  onToggleChecked: (nodeId: string, multi: boolean, range: boolean) => void;
  onToggleExpand: (nodeId: string) => void;
  onStartEdit: (node: WbsNode) => void;
  onEditChange: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onAddChild: (nodeId: string) => void;
  onDelete: (node: WbsNode) => void;
  onCopy: (nodeId: string) => void;
  onDuplicate: (nodeId: string) => void;
  onDragStart: (nodeId: string) => void;
  onDragEnd: () => void;
  onDragOverRow: (nodeId: string, clientY: number, rowTop: number, rowHeight: number) => void;
  onDropRow: (nodeId: string) => void;
}

function resolveDropPosition(
  clientY: number,
  rowTop: number,
  rowHeight: number
): WbsDropPosition {
  const relativeY = clientY - rowTop;
  if (relativeY < rowHeight * 0.25) {
    return 'before';
  }
  if (relativeY > rowHeight * 0.75) {
    return 'after';
  }
  return 'inside';
}

const WbsTreeRow = memo(function WbsTreeRow({
  row,
  isFocused,
  isChecked,
  isEditing,
  isExpanded,
  isLoading,
  isSearchMatch,
  isDragging,
  isDropTarget,
  dropPosition,
  editValue,
  canEdit,
  onSelect,
  onToggleChecked,
  onToggleExpand,
  onStartEdit,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  onAddChild,
  onDelete,
  onCopy,
  onDuplicate,
  onDragStart,
  onDragEnd,
  onDragOverRow,
  onDropRow,
}: WbsTreeRowProps): React.JSX.Element {
  const { node, depth } = row;
  const rowRef = useRef<HTMLDivElement>(null);
  const hasChildren = node.has_children || isExpanded;

  return (
    <div
      ref={rowRef}
      role="treeitem"
      aria-selected={isFocused || isChecked}
      aria-expanded={hasChildren ? isExpanded : undefined}
      draggable={canEdit && !isEditing}
      onDragStart={(event) => {
        if (!canEdit || isEditing) {
          event.preventDefault();
          return;
        }
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', node.id);
        onDragStart(node.id);
      }}
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        if (!canEdit) {
          return;
        }
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        const rect = rowRef.current?.getBoundingClientRect();
        if (rect) {
          onDragOverRow(node.id, event.clientY, rect.top, rect.height);
        }
      }}
      onDrop={(event) => {
        if (!canEdit) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        onDropRow(node.id);
      }}
      className={cn(
        'group relative grid grid-cols-[20px_20px_24px_96px_minmax(0,1fr)_auto] items-center gap-2 border-b px-2 text-sm transition-colors last:border-b-0',
        (isFocused || isChecked) && 'bg-primary/8',
        isSearchMatch && 'bg-amber-500/10',
        isDragging && 'opacity-40',
        isDropTarget && dropPosition === 'inside' && 'bg-primary/12 ring-1 ring-inset ring-primary/30',
        'hover:bg-muted/50'
      )}
      style={{ height: WBS_ROW_HEIGHT, paddingLeft: `${depth * 20 + 8}px` }}
      onClick={(event) => {
        onSelect(
          node.id,
          event.ctrlKey || event.metaKey,
          event.shiftKey
        );
      }}
      onDoubleClick={() => {
        if (canEdit) {
          onStartEdit(node);
        }
      }}
    >
      {isDropTarget && dropPosition === 'before' && (
        <span className="pointer-events-none absolute inset-x-2 top-0 h-0.5 bg-primary" />
      )}
      {isDropTarget && dropPosition === 'after' && (
        <span className="pointer-events-none absolute inset-x-2 bottom-0 h-0.5 bg-primary" />
      )}

      {depth > 0 && (
        <span
          className="pointer-events-none absolute top-0 bottom-0 w-px bg-border/70"
          style={{ left: `${depth * 20}px` }}
        />
      )}

      {canEdit ? (
        <button
          type="button"
          className="flex h-5 w-5 cursor-grab items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
          aria-label="Drag to move"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      ) : (
        <span />
      )}

      <label
        className="flex h-6 w-6 items-center justify-center"
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <input
          type="checkbox"
          className="h-3.5 w-3.5 accent-primary"
          checked={isChecked}
          aria-label={`Select WBS ${node.wbs_code}`}
          onChange={(event) => {
            onToggleChecked(
              node.id,
              event.nativeEvent instanceof MouseEvent
                ? event.nativeEvent.ctrlKey || event.nativeEvent.metaKey
                : true,
              event.nativeEvent instanceof MouseEvent
                ? event.nativeEvent.shiftKey
                : false
            );
          }}
        />
      </label>

      <button
        type="button"
        className="flex h-6 w-6 items-center justify-center rounded hover:bg-muted"
        onClick={(event) => {
          event.stopPropagation();
          if (hasChildren || !isExpanded) {
            onToggleExpand(node.id);
          }
        }}
        aria-label={isExpanded ? 'Collapse' : 'Expand'}
      >
        {isLoading ? (
          <span className="h-3 w-3 animate-pulse rounded-full bg-muted-foreground/40" />
        ) : hasChildren ? (
          isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )
        ) : (
          <span className="h-4 w-4" />
        )}
      </button>

      <div className="flex items-center gap-2">
        {hasChildren ? (
          isExpanded ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-amber-600" />
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-amber-600" />
          )
        ) : (
          <span className="inline-block h-4 w-4 shrink-0 rounded-sm border border-border bg-background" />
        )}
        <span className="font-mono text-xs font-medium text-muted-foreground">
          {node.wbs_code}
        </span>
      </div>

      {isEditing ? (
        <Input
          value={editValue}
          onChange={(event) => onEditChange(event.target.value)}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === 'Enter') {
              onSaveEdit();
            }
            if (event.key === 'Escape') {
              onCancelEdit();
            }
          }}
          onClick={(event) => event.stopPropagation()}
          autoFocus
          className="h-8"
        />
      ) : (
        <span className="truncate font-medium">{node.description}</span>
      )}

      <div
        className="flex items-center justify-end gap-0.5 pr-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 data-[visible=true]:opacity-100"
        data-visible={isFocused || isChecked}
        onClick={(event) => event.stopPropagation()}
      >
        {canEdit ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Add child (Insert)"
              onClick={() => onAddChild(node.id)}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Rename (F2)"
              onClick={() => onStartEdit(node)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Copy branch (Ctrl+C)"
              onClick={() => onCopy(node.id)}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Duplicate branch"
              onClick={() => onDuplicate(node.id)}
            >
              <CopyPlus className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              title="Delete (Delete)"
              aria-label={`Delete WBS ${node.wbs_code}`}
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onDelete(node);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
});

export const WbsTree = forwardRef<WbsTreeHandle, WbsTreeProps>(function WbsTree(
  {
    rows,
    selectedId,
    checkedIds,
    editingId,
    editValue,
    expandedIds,
    loadingParentIds,
    searchQuery,
    canEdit,
    draggingId,
    onSelect,
    onToggleChecked,
    onToggleSelectAll,
    onToggleExpand,
    onStartEdit,
    onEditChange,
    onSaveEdit,
    onCancelEdit,
    onAddChild,
    onDelete,
    onCopy,
    onDuplicate,
    onDragStart,
    onDragEnd,
    onDrop,
    isDropForbidden,
  },
  ref
): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(480);
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      getScrollTop: () => containerRef.current?.scrollTop ?? scrollTop,
      setScrollTop: (value: number) => {
        if (containerRef.current) {
          containerRef.current.scrollTop = value;
        }
        setScrollTop(value);
      },
    }),
    [scrollTop]
  );

  const allVisibleSelected =
    rows.length > 0 && rows.every(({ node }) => checkedIds.has(node.id));
  const someVisibleSelected =
    !allVisibleSelected && rows.some(({ node }) => checkedIds.has(node.id));

  const visibleCount = Math.ceil(containerHeight / WBS_ROW_HEIGHT) + 8;
  const startIndex = Math.max(0, Math.floor(scrollTop / WBS_ROW_HEIGHT) - 3);
  const endIndex = Math.min(rows.length, startIndex + visibleCount);
  const visibleRows = useMemo(
    () => rows.slice(startIndex, endIndex),
    [endIndex, rows, startIndex]
  );
  const paddingTop = startIndex * WBS_ROW_HEIGHT;
  const paddingBottom = Math.max(0, (rows.length - endIndex) * WBS_ROW_HEIGHT);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  const handleDragOverRow = useCallback(
    (nodeId: string, clientY: number, rowTop: number, rowHeight: number) => {
      if (isDropForbidden(nodeId)) {
        setDropIndicator(null);
        return;
      }
      setDropIndicator({
        nodeId,
        position: resolveDropPosition(clientY, rowTop, rowHeight),
      });
    },
    [isDropForbidden]
  );

  const handleDropRow = useCallback(
    (nodeId: string) => {
      if (!dropIndicator || dropIndicator.nodeId !== nodeId || isDropForbidden(nodeId)) {
        setDropIndicator(null);
        onDragEnd();
        return;
      }
      onDrop(nodeId, dropIndicator.position);
      setDropIndicator(null);
    },
    [dropIndicator, isDropForbidden, onDragEnd, onDrop]
  );

  return (
    <div
      className="overflow-hidden rounded-lg border bg-card shadow-sm"
      role="tree"
      aria-label="Work breakdown structure"
    >
      <div className="grid grid-cols-[20px_20px_24px_96px_minmax(0,1fr)_auto] gap-2 border-b bg-muted/50 px-2 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span />
        <label className="flex h-5 w-5 items-center justify-center normal-case">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 accent-primary"
            checked={allVisibleSelected}
            ref={(element) => {
              if (element) {
                element.indeterminate = someVisibleSelected;
              }
            }}
            aria-label="Select all visible WBS nodes"
            onChange={(event) => onToggleSelectAll(event.target.checked)}
          />
        </label>
        <span />
        <span>WBS</span>
        <span>Description</span>
        <span className="pr-2 text-right">Actions</span>
      </div>

      {rows.length === 0 ? (
        <div className="px-4 py-16 text-center text-sm text-muted-foreground">
          No work breakdown structure. Add a root level to get started.
        </div>
      ) : (
        <div
          ref={containerRef}
          className="max-h-[min(72vh,760px)] overflow-auto"
          onScroll={handleScroll}
        >
          <div style={{ height: rows.length * WBS_ROW_HEIGHT }}>
            <div style={{ paddingTop, paddingBottom }}>
              {visibleRows.map(({ node, depth }) => (
                <WbsTreeRow
                  key={node.id}
                  row={{ node, depth }}
                  isFocused={selectedId === node.id}
                  isChecked={checkedIds.has(node.id)}
                  isEditing={editingId === node.id}
                  isExpanded={expandedIds.has(node.id)}
                  isLoading={loadingParentIds.has(node.id)}
                  isSearchMatch={nodeMatchesSearch(node, searchQuery)}
                  isDragging={draggingId === node.id}
                  isDropTarget={dropIndicator?.nodeId === node.id}
                  dropPosition={
                    dropIndicator?.nodeId === node.id ? dropIndicator.position : null
                  }
                  editValue={editValue}
                  canEdit={canEdit}
                  onSelect={onSelect}
                  onToggleChecked={onToggleChecked}
                  onToggleExpand={onToggleExpand}
                  onStartEdit={onStartEdit}
                  onEditChange={onEditChange}
                  onSaveEdit={onSaveEdit}
                  onCancelEdit={onCancelEdit}
                  onAddChild={onAddChild}
                  onDelete={onDelete}
                  onCopy={onCopy}
                  onDuplicate={onDuplicate}
                  onDragStart={onDragStart}
                  onDragEnd={() => {
                    setDropIndicator(null);
                    onDragEnd();
                  }}
                  onDragOverRow={handleDragOverRow}
                  onDropRow={handleDropRow}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
