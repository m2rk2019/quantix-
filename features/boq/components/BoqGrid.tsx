'use client';

import { Calculator, Crosshair, Loader2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  BOQ_ROW_HEIGHT,
  type BoqColumnDef,
  getNextEditableColumn,
} from '@/features/boq/constants';
import { QuantitySourceBadge } from '@/features/takeoff/components/QuantitySourceBadge';
import {
  calculateTotalAmount,
  calculateTotalRate,
  formatBoqNumber,
} from '@/lib/boq/calculations';
import { ROUTES } from '@/lib/constants/routes';
import { formatCurrency } from '@/lib/format-currency';
import { BOQ_LOAD_MORE_THRESHOLD_PX } from '@/lib/performance/constants';
import { cn } from '@/lib/utils';
import type { CurrencyCode } from '@/types/project';
import type { BoqEditableField, BoqItem, BoqSortField } from '@/types/boq';
import { BOQ_EDITABLE_FIELDS } from '@/types/boq';

export interface GridBoqRow extends BoqItem {
  dirty?: boolean;
  saving?: boolean;
  error?: string | null;
  fieldErrors?: Partial<Record<BoqEditableField, string>>;
}

interface BoqGridProps {
  rows: GridBoqRow[];
  columns: BoqColumnDef[];
  currency: CurrencyCode;
  canEdit: boolean;
  selectedIds: Set<string>;
  focusedCell: { rowId: string; columnId: BoqEditableField } | null;
  editingCell: { rowId: string; columnId: BoqEditableField } | null;
  sortField: BoqSortField;
  sortOrder: 'asc' | 'desc';
  onSort: (field: BoqSortField) => void;
  onSelectRow: (rowId: string, multi: boolean, range: boolean) => void;
  onFocusCell: (rowId: string, columnId: BoqEditableField) => void;
  onStartEdit: (rowId: string, columnId: BoqEditableField) => void;
  /** Commit a cell value (blur / Enter / Tab / Save). Never called per keystroke. */
  onCellCommit: (
    rowId: string,
    field: BoqEditableField,
    value: string
  ) => void;
  onCellCancel: () => void;
  onDeleteRow: (rowId: string) => void;
  onOpenRateAnalysis: (rowId: string) => void;
  onColumnResize: (columnId: string, width: number) => void;
  onBulkPaste: (text: string) => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

const STICKY_COLUMN_IDS = new Set(['select', 'item_code']);

const RATE_OVERRIDE_FIELDS: Record<string, keyof GridBoqRow> = {
  material_rate: 'material_rate_override',
  labor_rate: 'labor_rate_override',
  equipment_rate: 'equipment_rate_override',
  subcontract_rate: 'subcontract_rate_override',
  other_cost_rate: 'other_cost_rate_override',
};

function stickyStyleFor(
  stickyOffsets: Map<string, number>,
  columnId: string,
  width: number
): React.CSSProperties {
  const left = stickyOffsets.get(columnId);
  if (left === undefined) {
    return { width };
  }
  return {
    width,
    position: 'sticky',
    left,
    zIndex: 10,
  };
}

function displayCellValue(
  row: GridBoqRow,
  column: BoqColumnDef,
  currency: CurrencyCode
): string {
  const value = row[column.id as keyof GridBoqRow];
  if (column.id === 'total_rate' || column.id === 'total_amount') {
    return formatCurrency(Number(value), currency);
  }
  if (column.numeric) {
    return formatBoqNumber(Number(value));
  }
  return String(value ?? '');
}

function initialDraftValue(
  row: GridBoqRow,
  columnId: BoqEditableField
): string {
  const value = row[columnId];
  if (columnId === 'quantity' || columnId.endsWith('_rate')) {
    // Keep raw editable text without forcing .toFixed on every keystroke.
    return String(value ?? '');
  }
  return String(value ?? '');
}

interface BoqGridRowProps {
  row: GridBoqRow;
  rowIndex: number;
  columns: BoqColumnDef[];
  currency: CurrencyCode;
  canEdit: boolean;
  isSelected: boolean;
  focusedColumnId: BoqEditableField | null;
  editingColumnId: BoqEditableField | null;
  draftValue: string;
  stickyOffsets: Map<string, number>;
  onSelectRow: (rowId: string, multi: boolean, range: boolean) => void;
  onFocusCell: (rowId: string, columnId: BoqEditableField) => void;
  onStartEdit: (rowId: string, columnId: BoqEditableField) => void;
  onDraftChange: (value: string) => void;
  onCommitEdit: (direction?: 'next' | 'prev' | 'down' | 'up' | 'blur') => void;
  onCellCancel: () => void;
  onDeleteRow: (rowId: string) => void;
  onOpenRateAnalysis: (rowId: string) => void;
}

const BoqGridRow = memo(function BoqGridRow({
  row,
  columns,
  currency,
  canEdit,
  isSelected,
  focusedColumnId,
  editingColumnId,
  draftValue,
  stickyOffsets,
  onSelectRow,
  onFocusCell,
  onStartEdit,
  onDraftChange,
  onCommitEdit,
  onCellCancel,
  onDeleteRow,
  onOpenRateAnalysis,
}: BoqGridRowProps): React.JSX.Element {
  const liveTotalRate = calculateTotalRate(row);
  const liveTotalAmount = calculateTotalAmount(row.quantity, liveTotalRate);

  return (
    <div
      className={cn(
        'flex border-b text-sm last:border-b-0',
        isSelected && 'bg-accent/30',
        row.dirty && 'border-l-2 border-l-primary',
        row.error && 'border-l-2 border-l-destructive',
        row.needs_estimator_review &&
          !row.error &&
          'border-l-2 border-l-amber-500 bg-amber-500/5'
      )}
      style={{ height: BOQ_ROW_HEIGHT }}
      title={
        row.error ??
        (row.needs_estimator_review
          ? 'Needs Estimator Review (new or low-confidence template match)'
          : undefined)
      }
    >
      {columns.map((column) => {
        const columnId = column.id as BoqEditableField;
        const isFocused = focusedColumnId === columnId;
        const isEditing = editingColumnId === columnId;
        const isEditable =
          canEdit &&
          column.editable &&
          column.id !== 'select' &&
          column.id !== 'actions';
        const fieldError = row.fieldErrors?.[columnId];

        if (column.id === 'select') {
          return (
            <div
              key={column.id}
              className="flex shrink-0 items-center justify-center border-r bg-background px-2"
              style={stickyStyleFor(stickyOffsets, column.id, column.width)}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(event) => {
                  onSelectRow(
                    row.id,
                    event.nativeEvent instanceof MouseEvent &&
                      (event.nativeEvent.metaKey ||
                        event.nativeEvent.ctrlKey),
                    event.nativeEvent instanceof MouseEvent &&
                      event.nativeEvent.shiftKey
                  );
                }}
                aria-label={`Select ${row.item_code}`}
              />
            </div>
          );
        }

        if (column.id === 'actions') {
          const takeoffHref =
            row.takeoff_measurement_id != null
              ? `${ROUTES.projectTakeoff(row.project_id)}?measurementId=${row.takeoff_measurement_id}&boqId=${row.id}`
              : `${ROUTES.projectTakeoff(row.project_id)}?boqId=${row.id}`;
          return (
            <div
              key={column.id}
              className="flex shrink-0 items-center justify-center gap-1 border-r px-1"
              style={{ width: column.width }}
            >
              {(row.takeoff_link_count ?? 0) > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title="Open linked takeoff measurement"
                  asChild
                >
                  <Link href={takeoffHref}>
                    <Crosshair className="h-3.5 w-3.5 text-sky-600" />
                  </Link>
                </Button>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="Rate Analysis"
                onClick={() => onOpenRateAnalysis(row.id)}
              >
                <Calculator className="h-3.5 w-3.5" />
              </Button>
              {row.saving && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
              {canEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => onDeleteRow(row.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          );
        }

        if (
          isEditable &&
          isEditing &&
          BOQ_EDITABLE_FIELDS.includes(columnId)
        ) {
          return (
            <div
              key={column.id}
              className="shrink-0 border-r bg-background p-1"
              style={stickyStyleFor(stickyOffsets, column.id, column.width)}
            >
                <Input
                  value={draftValue}
                  onChange={(event) => onDraftChange(event.target.value)}
                  onBlur={() => onCommitEdit('blur')}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      event.preventDefault();
                      onCellCancel();
                      return;
                    }
                    if (event.key === 'Tab') {
                      event.preventDefault();
                      onCommitEdit(event.shiftKey ? 'prev' : 'next');
                      return;
                    }
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      onCommitEdit('down');
                      return;
                    }
                    if (event.key === 'ArrowDown') {
                      event.preventDefault();
                      onCommitEdit('down');
                      return;
                    }
                    if (event.key === 'ArrowUp') {
                      event.preventDefault();
                      onCommitEdit('up');
                    }
                  }}
                  className={cn(
                    'h-8 text-sm',
                    column.align === 'right' && 'text-right',
                    fieldError && 'border-destructive'
                  )}
                  autoFocus
                  aria-invalid={Boolean(fieldError)}
                />
            </div>
          );
        }

        const displayValue =
          column.id === 'total_rate'
            ? formatCurrency(liveTotalRate, currency)
            : column.id === 'total_amount'
              ? formatCurrency(liveTotalAmount, currency)
              : displayCellValue(row, column, currency);
        const overrideField = RATE_OVERRIDE_FIELDS[column.id];
        const isOverridden = overrideField
          ? Boolean(row[overrideField])
          : false;
        const quantityLocked = row.quantity_source === 'takeoff';

        if (column.id === 'quantity') {
          return (
            <button
              key={column.id}
              type="button"
              className={cn(
                'relative flex shrink-0 flex-col items-end justify-center gap-0.5 border-r px-2 py-1 text-right hover:bg-muted/40',
                isFocused && 'ring-2 ring-inset ring-primary/40',
                fieldError && 'text-destructive',
                quantityLocked && 'bg-sky-500/5'
              )}
              style={stickyStyleFor(stickyOffsets, column.id, column.width)}
              disabled={!isEditable || quantityLocked}
              title={
                quantityLocked
                  ? 'Quantity driven by Takeoff (live sync)'
                  : undefined
              }
              onClick={() => {
                if (quantityLocked) return;
                onFocusCell(row.id, columnId);
              }}
              onDoubleClick={() => {
                if (!quantityLocked) onStartEdit(row.id, columnId);
              }}
            >
              <span className="text-sm tabular-nums">{displayValue}</span>
              <QuantitySourceBadge source={row.quantity_source} />
            </button>
          );
        }

        return (
          <button
            key={column.id}
            type="button"
            className={cn(
              'relative shrink-0 truncate border-r px-2 py-2 text-left hover:bg-muted/40',
              STICKY_COLUMN_IDS.has(column.id) && 'bg-background',
              column.align === 'right' && 'text-right',
              isFocused && 'ring-2 ring-inset ring-primary/40',
              fieldError && 'text-destructive',
              isOverridden && 'bg-amber-500/10',
              (column.id === 'total_rate' || column.id === 'total_amount') &&
                'font-medium text-muted-foreground',
              column.id === 'total_amount' && 'font-semibold text-foreground'
            )}
            style={stickyStyleFor(stickyOffsets, column.id, column.width)}
            disabled={!isEditable}
            title={isOverridden ? 'Manually overridden rate' : undefined}
            onClick={() => {
              onSelectRow(row.id, false, false);
              if (isEditable) {
                onFocusCell(row.id, columnId);
              }
            }}
            onDoubleClick={() => {
              if (isEditable) {
                onStartEdit(row.id, columnId);
              }
            }}
          >
            {isOverridden && (
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
            )}
            {displayValue}
          </button>
        );
      })}
    </div>
  );
});

export function BoqGrid({
  rows,
  columns,
  currency,
  canEdit,
  selectedIds,
  focusedCell,
  editingCell,
  sortField,
  sortOrder,
  onSort,
  onSelectRow,
  onFocusCell,
  onStartEdit,
  onCellCommit,
  onCellCancel,
  onDeleteRow,
  onOpenRateAnalysis,
  onColumnResize,
  onBulkPaste,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: BoqGridProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(480);
  const [draftValue, setDraftValue] = useState('');
  const draftValueRef = useRef('');
  const editingCellRef = useRef(editingCell);
  const isCommittingRef = useRef(false);
  const [resizing, setResizing] = useState<{
    columnId: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  const totalWidth = useMemo(
    () => columns.reduce((sum, column) => sum + column.width, 0),
    [columns]
  );

  const stickyOffsets = useMemo(() => {
    const offsets = new Map<string, number>();
    let left = 0;
    for (const column of columns) {
      if (STICKY_COLUMN_IDS.has(column.id)) {
        offsets.set(column.id, left);
        left += column.width;
      }
    }
    return offsets;
  }, [columns]);

  const visibleCount = Math.ceil(containerHeight / BOQ_ROW_HEIGHT) + 4;
  const startIndex = Math.max(0, Math.floor(scrollTop / BOQ_ROW_HEIGHT) - 2);
  const endIndex = Math.min(rows.length, startIndex + visibleCount);
  const visibleRows = rows.slice(startIndex, endIndex);
  const paddingTop = startIndex * BOQ_ROW_HEIGHT;
  const paddingBottom = Math.max(0, (rows.length - endIndex) * BOQ_ROW_HEIGHT);

  useEffect(() => {
    editingCellRef.current = editingCell;
    if (!editingCell) {
      draftValueRef.current = '';
      // Sync draft when leaving edit mode; isolated from render.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- draft mirrors editingCell target
      setDraftValue('');
      return;
    }

    const row = rows.find((item) => item.id === editingCell.rowId);
    if (!row) {
      return;
    }

    const next = initialDraftValue(row, editingCell.columnId);
    draftValueRef.current = next;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- re-seed draft when edit target changes
    setDraftValue(next);
    // Intentionally only re-seed draft when the editing target changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingCell?.rowId, editingCell?.columnId]);

  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const element = event.currentTarget;
      setScrollTop(element.scrollTop);

      if (!hasMore || isLoadingMore || !onLoadMore) {
        return;
      }

      const remaining =
        element.scrollHeight - element.scrollTop - element.clientHeight;

      if (remaining <= BOQ_LOAD_MORE_THRESHOLD_PX) {
        onLoadMore();
      }
    },
    [hasMore, isLoadingMore, onLoadMore]
  );

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

  const handleResizeMove = useCallback(
    (event: MouseEvent) => {
      if (!resizing) {
        return;
      }

      const delta = event.clientX - resizing.startX;
      const column = columns.find((item) => item.id === resizing.columnId);
      const minWidth = column?.minWidth ?? 48;
      onColumnResize(
        resizing.columnId,
        Math.max(minWidth, resizing.startWidth + delta)
      );
    },
    [columns, onColumnResize, resizing]
  );

  const handleResizeEnd = useCallback(() => {
    setResizing(null);
  }, []);

  useEffect(() => {
    if (!resizing) {
      return;
    }

    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [handleResizeEnd, handleResizeMove, resizing]);

  const handleDraftChange = useCallback((value: string) => {
    draftValueRef.current = value;
    setDraftValue(value);
  }, []);

  const handleCommitEdit = useCallback(
    (direction: 'next' | 'prev' | 'down' | 'up' | 'blur' = 'blur') => {
      const current = editingCellRef.current;
      if (!current || isCommittingRef.current) {
        return;
      }

      isCommittingRef.current = true;
      const value = draftValueRef.current;
      onCellCommit(current.rowId, current.columnId, value);

      const finish = () => {
        isCommittingRef.current = false;
      };

      if (direction === 'blur') {
        queueMicrotask(finish);
        return;
      }

      const rowIndex = rows.findIndex((row) => row.id === current.rowId);
      if (rowIndex === -1) {
        queueMicrotask(finish);
        return;
      }

      if (direction === 'next' || direction === 'prev') {
        const nextColumn = getNextEditableColumn(
          current.columnId,
          direction === 'prev' ? -1 : 1
        );
        if (nextColumn) {
          onStartEdit(current.rowId, nextColumn);
        }
        queueMicrotask(finish);
        return;
      }

      const targetIndex =
        direction === 'down' ? rowIndex + 1 : rowIndex - 1;
      const targetRow = rows[targetIndex];
      if (targetRow) {
        onStartEdit(targetRow.id, current.columnId);
      }
      queueMicrotask(finish);
    },
    [onCellCommit, onStartEdit, rows]
  );

  return (
    <div
      className="overflow-hidden rounded-lg border bg-card shadow-sm"
      onPaste={(event) => {
        if (!canEdit) {
          return;
        }
        const text = event.clipboardData.getData('text/plain');
        if (!text.includes('\t') && !text.includes('\n')) {
          return;
        }
        event.preventDefault();
        onBulkPaste(text);
      }}
    >
      <div className="overflow-x-auto">
        <div style={{ minWidth: totalWidth }}>
          <div className="sticky top-0 z-30 flex border-b bg-muted/90 backdrop-blur">
            {columns.map((column) => (
              <div
                key={column.id}
                className={cn(
                  'relative shrink-0 border-r px-2 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground last:border-r-0',
                  column.align === 'right' && 'text-right',
                  STICKY_COLUMN_IDS.has(column.id) && 'bg-muted/95',
                  column.id !== 'select' &&
                    column.id !== 'actions' &&
                    'cursor-pointer hover:text-foreground'
                )}
                style={stickyStyleFor(stickyOffsets, column.id, column.width)}
                onClick={() => {
                  if (column.id !== 'select' && column.id !== 'actions') {
                    onSort(column.id as BoqSortField);
                  }
                }}
              >
                {column.label}
                {sortField === column.id && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
                <span
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/40"
                  onMouseDown={(event) => {
                    event.stopPropagation();
                    setResizing({
                      columnId: column.id,
                      startX: event.clientX,
                      startWidth: column.width,
                    });
                  }}
                />
              </div>
            ))}
          </div>

          <div
            ref={containerRef}
            className="max-h-[min(68vh,720px)] overflow-auto"
            onScroll={handleScroll}
          >
            {rows.length === 0 ? (
              <div className="px-4 py-16 text-center text-sm text-muted-foreground">
                No BOQ items for the current filter.
              </div>
            ) : (
              <div style={{ height: rows.length * BOQ_ROW_HEIGHT }}>
                <div style={{ paddingTop, paddingBottom }}>
                  {isLoadingMore ? (
                    <div className="px-4 py-2 text-center text-xs text-muted-foreground">
                      Loading more items…
                    </div>
                  ) : null}
                  {visibleRows.map((row, visibleIndex) => {
                    const rowIndex = startIndex + visibleIndex;
                    const isEditingThisRow = editingCell?.rowId === row.id;

                    return (
                      <BoqGridRow
                        key={row.id}
                        row={row}
                        rowIndex={rowIndex}
                        columns={columns}
                        currency={currency}
                        canEdit={canEdit}
                        isSelected={selectedIds.has(row.id)}
                        focusedColumnId={
                          focusedCell?.rowId === row.id
                            ? focusedCell.columnId
                            : null
                        }
                        editingColumnId={
                          isEditingThisRow ? editingCell.columnId : null
                        }
                        draftValue={isEditingThisRow ? draftValue : ''}
                        stickyOffsets={stickyOffsets}
                        onSelectRow={onSelectRow}
                        onFocusCell={onFocusCell}
                        onStartEdit={onStartEdit}
                        onDraftChange={handleDraftChange}
                        onCommitEdit={handleCommitEdit}
                        onCellCancel={onCellCancel}
                        onDeleteRow={onDeleteRow}
                        onOpenRateAnalysis={onOpenRateAnalysis}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
