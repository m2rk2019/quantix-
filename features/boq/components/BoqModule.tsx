'use client';

import {
  ClipboardPaste,
  Copy,
  CopyPlus,
  Plus,
  Redo2,
  Search,
  Trash2,
  Undo2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ConnectivityBanner } from '@/components/connectivity/ConnectivityBanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableSkeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BoqGrid,
  type GridBoqRow,
} from '@/features/boq/components/BoqGrid';
import {
  DEFAULT_BOQ_COLUMNS,
  type BoqColumnDef,
} from '@/features/boq/constants';
import { useUndoRedo } from '@/features/boq/hooks/useUndoRedo';
import { RateAnalysisDialog } from '@/features/rate-analysis/components/RateAnalysisDialog';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import {
  BOQ_PAGE_SIZE,
  BOQ_SEARCH_DEBOUNCE_MS,
} from '@/lib/performance/constants';
import {
  calculateTotalAmount,
  calculateTotalRate,
  parseNumericField,
  roundCurrency,
} from '@/lib/boq/calculations';
import { parseExcelClipboard } from '@/lib/boq/excel-paste';
import { validateBoqRow } from '@/lib/boq/validation';
import { formatCurrency } from '@/lib/format-currency';
import {
  createBoqItemAction,
  deleteBoqItemAction,
  duplicateBoqItemAction,
  loadBoqItemsAction,
  loadBoqTotalsAction,
  pasteBoqRowsAction,
  updateBoqItemAction,
} from '@/services/boq/boq-actions';
import type {
  BoqClipboardRow,
  BoqEditableField,
  BoqItem,
  BoqSortField,
  BoqTotals,
  WbsFilterOption,
} from '@/types/boq';
import type { CurrencyCode } from '@/types/project';

interface BoqModuleProps {
  projectId: string;
  canEdit: boolean;
  currency: CurrencyCode;
  wbsOptions: WbsFilterOption[];
  initialItems: BoqItem[];
  initialTotal: number;
  initialTotals: BoqTotals;
  initialWbsFilter?: string;
}

function toGridRows(items: BoqItem[]): GridBoqRow[] {
  return items.map((item) => ({ ...item }));
}

function rowToUpdateInput(row: GridBoqRow) {
  return {
    item_code: row.item_code,
    description: row.description,
    unit: row.unit,
    quantity: row.quantity,
    material_rate: row.material_rate,
    labor_rate: row.labor_rate,
    equipment_rate: row.equipment_rate,
    subcontract_rate: row.subcontract_rate,
    other_cost_rate: row.other_cost_rate,
  };
}

function rowToClipboard(row: GridBoqRow): BoqClipboardRow {
  return {
    item_code: row.item_code,
    description: row.description,
    unit: row.unit,
    quantity: row.quantity,
    material_rate: row.material_rate,
    labor_rate: row.labor_rate,
    equipment_rate: row.equipment_rate,
    subcontract_rate: row.subcontract_rate,
    other_cost_rate: row.other_cost_rate,
  };
}

export function BoqModule({
  projectId,
  canEdit,
  currency,
  wbsOptions,
  initialItems,
  initialTotal,
  initialTotals,
  initialWbsFilter = 'all',
}: BoqModuleProps): React.JSX.Element {
  const {
    state: rows,
    set: setRows,
    replace: replaceRows,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetRows,
  } = useUndoRedo<GridBoqRow[]>(toGridRows(initialItems));

  const [columns, setColumns] = useState<BoqColumnDef[]>(DEFAULT_BOQ_COLUMNS);
  const [wbsFilter, setWbsFilter] = useState<string>(initialWbsFilter);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<BoqSortField>('wbs_order');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [focusedCell, setFocusedCell] = useState<{
    rowId: string;
    columnId: BoqEditableField;
  } | null>(null);
  const [editingCell, setEditingCell] = useState<{
    rowId: string;
    columnId: BoqEditableField;
  } | null>(null);
  const [editSnapshot, setEditSnapshot] = useState<GridBoqRow | null>(null);
  const [clipboard, setClipboard] = useState<BoqClipboardRow[]>([]);
  const [totals, setTotals] = useState<BoqTotals>(initialTotals);
  const [totalCount, setTotalCount] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialTotal > initialItems.length);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisItemId, setAnalysisItemId] = useState<string | null>(null);
  const { isOnline } = useNetworkStatus();
  const rowsRef = useRef(rows);
  const editingCellRef = useRef(editingCell);
  const searchTimerRef = useRef<number | null>(null);
  const isEditingRef = useRef(false);

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    editingCellRef.current = editingCell;
    isEditingRef.current = editingCell !== null;
  }, [editingCell]);

  const activeWbsId = wbsFilter === 'all' ? null : wbsFilter;
  const displayTotals = totals.categoryTotals;

  const showStatus = useCallback((message: string) => {
    setStatusMessage(message);
    window.setTimeout(() => setStatusMessage(null), 2500);
  }, []);

  const refreshTotals = useCallback(async () => {
    const nextTotals = await loadBoqTotalsAction(projectId, activeWbsId);
    setTotals(nextTotals);
  }, [activeWbsId, projectId]);

  const reload = useCallback(
    async (overrides?: {
      wbsFilter?: string;
      search?: string;
      sortField?: BoqSortField;
      sortOrder?: 'asc' | 'desc';
      page?: number;
      append?: boolean;
    }) => {
      // Never wipe the grid while a cell is being edited.
      if (isEditingRef.current && !overrides?.append) {
        return;
      }

      if (!isOnline && !overrides?.append) {
        setLoadError('You are offline. Reconnect to refresh BOQ data.');
        return;
      }

      const nextPage = overrides?.page ?? 1;
      const append = overrides?.append ?? false;

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      setLoadError(null);

      const nextWbsFilter = overrides?.wbsFilter ?? wbsFilter;
      const nextSearch = overrides?.search ?? search;
      const nextSortField = overrides?.sortField ?? sortField;
      const nextSortOrder = overrides?.sortOrder ?? sortOrder;
      const nextWbsId = nextWbsFilter === 'all' ? null : nextWbsFilter;

      try {
        const result = await loadBoqItemsAction(projectId, {
          wbsId: nextWbsId,
          search: nextSearch,
          sort: nextSortField,
          order: nextSortOrder,
          page: nextPage,
          pageSize: BOQ_PAGE_SIZE,
        });
        const nextTotals = await loadBoqTotalsAction(projectId, nextWbsId);

        const nextRows = toGridRows(result.items);
        if (append) {
          const merged = [...rowsRef.current, ...nextRows];
          const seen = new Set<string>();
          const deduped = merged.filter((row) => {
            if (seen.has(row.id)) {
              return false;
            }
            seen.add(row.id);
            return true;
          });
          replaceRows(deduped);
        } else {
          resetRows(nextRows);
        }

        setTotals(nextTotals);
        setTotalCount(result.total);
        setPage(nextPage);
        setHasMore(nextPage < result.totalPages);
      } catch (error) {
        setLoadError(
          error instanceof Error ? error.message : 'Failed to load BOQ items.'
        );
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [
      isOnline,
      projectId,
      replaceRows,
      resetRows,
      search,
      sortField,
      sortOrder,
      wbsFilter,
    ]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (searchTimerRef.current !== null) {
        window.clearTimeout(searchTimerRef.current);
      }
      searchTimerRef.current = window.setTimeout(() => {
        void reload({ search: value, page: 1 });
      }, BOQ_SEARCH_DEBOUNCE_MS);
    },
    [reload]
  );

  const handleWbsFilterChange = useCallback(
    (value: string) => {
      setWbsFilter(value);
      void reload({ wbsFilter: value, page: 1 });
    },
    [reload]
  );

  const patchRowLocal = useCallback(
    (rowId: string, patch: Partial<GridBoqRow>) => {
      const next = rowsRef.current.map((item) =>
        item.id === rowId ? { ...item, ...patch } : item
      );
      rowsRef.current = next;
      replaceRows(next);
    },
    [replaceRows]
  );

  const persistRow = useCallback(
    async (rowId: string, rowSnapshot?: GridBoqRow) => {
      const row =
        rowSnapshot ?? rowsRef.current.find((item) => item.id === rowId);
      if (!row) {
        console.error('[BOQ UPDATE] persist skipped — row missing', { rowId });
        return;
      }

      const payload = rowToUpdateInput(row);

      if (process.env.NODE_ENV === 'development') {
        console.log('[BOQ UPDATE] client calling updateBoqItemAction', {
          projectId,
          rowId,
          payload,
        });
      }

      const validation = validateBoqRow(row);
      if (!validation.valid) {
        patchRowLocal(rowId, {
          fieldErrors: validation.fieldErrors,
          error: validation.message,
          dirty: true,
          saving: false,
        });
        showStatus(validation.message ?? 'Validation failed');
        return;
      }

      patchRowLocal(rowId, {
        ...row,
        saving: true,
        error: null,
        fieldErrors: {},
      });

      let result: Awaited<ReturnType<typeof updateBoqItemAction>>;
      try {
        result = await updateBoqItemAction(projectId, rowId, payload);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Save failed';
        console.error('[BOQ UPDATE] client exception', error);
        patchRowLocal(rowId, {
          ...row,
          saving: false,
          dirty: true,
          error: message,
        });
        showStatus(message);
        return;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[BOQ UPDATE] client response', result);
      }

      if (!result.success) {
        const message = result.error ?? 'Save failed';
        console.error('[BOQ UPDATE] failed', message);
        patchRowLocal(rowId, {
          ...row,
          saving: false,
          dirty: true,
          error: message,
        });
        showStatus(message);
        return;
      }

      // Apply server-confirmed values to this row only — never reload the table.
      const saved = result.item;
      patchRowLocal(rowId, {
        ...(saved ?? row),
        saving: false,
        dirty: false,
        error: null,
        fieldErrors: {},
      });
      showStatus('BOQ item saved');

      // Totals are footer-only; do not refetch grid rows.
      void refreshTotals().catch((error) => {
        console.error('[BOQ UPDATE] totals refresh failed', error);
      });
    },
    [patchRowLocal, projectId, refreshTotals, showStatus]
  );

  const handleCellCommit = useCallback(
    (rowId: string, field: BoqEditableField, value: string) => {
      const currentEditing = editingCellRef.current;
      const leavingEdit =
        currentEditing?.rowId === rowId &&
        currentEditing.columnId === field;

      if (leavingEdit) {
        setEditingCell(null);
        setEditSnapshot(null);
      }

      const currentRow = rowsRef.current.find((item) => item.id === rowId);
      if (!currentRow) {
        return;
      }

      const previousValue =
        field === 'item_code' || field === 'description' || field === 'unit'
          ? String(currentRow[field] ?? '')
          : String(roundCurrency(Number(currentRow[field] ?? 0)));

      const nextValue =
        field === 'item_code' || field === 'description' || field === 'unit'
          ? value
          : String(roundCurrency(parseNumericField(value)));

      if (nextValue === previousValue && !currentRow.dirty) {
        return;
      }

      const updated: GridBoqRow = { ...currentRow, dirty: true, error: null };

      if (
        field === 'item_code' ||
        field === 'description' ||
        field === 'unit'
      ) {
        updated[field] = value;
      } else {
        updated[field] = roundCurrency(parseNumericField(value));
      }

      const totalRate = calculateTotalRate(updated);
      updated.total_rate = totalRate;
      updated.total_amount = calculateTotalAmount(updated.quantity, totalRate);

      const validation = validateBoqRow(updated);
      updated.fieldErrors = validation.fieldErrors;
      updated.error = validation.message;

      // Build the next table state synchronously so persist uses the edited row,
      // not a stale rowsRef (React setState updaters are not always sync).
      const nextRows = rowsRef.current.map((row) =>
        row.id === rowId ? updated : row
      );
      rowsRef.current = nextRows;
      setRows(nextRows);

      if (process.env.NODE_ENV === 'development') {
        console.log('[BOQ UPDATE] cell committed', {
          rowId,
          field,
          value: nextValue,
        });
      }

      void persistRow(rowId, updated);
    },
    [persistRow, setRows]
  );

  const handleStartEdit = useCallback(
    (rowId: string, columnId: BoqEditableField) => {
      const row = rowsRef.current.find((item) => item.id === rowId);
      if (!row) {
        return;
      }
      setEditSnapshot({ ...row });
      setFocusedCell({ rowId, columnId });
      setEditingCell({ rowId, columnId });
    },
    []
  );

  const handleCellCancel = useCallback(() => {
    if (!editingCell || !editSnapshot) {
      setEditingCell(null);
      return;
    }

    replaceRows(
      rowsRef.current.map((row) =>
        row.id === editingCell.rowId ? editSnapshot : row
      )
    );
    setEditingCell(null);
    setEditSnapshot(null);
  }, [editSnapshot, editingCell, replaceRows]);

  const handleSort = useCallback(
    (field: BoqSortField) => {
      if (sortField === field) {
        const nextOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        setSortOrder(nextOrder);
        void reload({ sortField: field, sortOrder: nextOrder, page: 1 });
        return;
      }

      setSortField(field);
      setSortOrder('asc');
      void reload({ sortField: field, sortOrder: 'asc', page: 1 });
    },
    [reload, sortField, sortOrder]
  );

  const handleSelectRow = useCallback(
    (rowId: string, multi: boolean, range: boolean) => {
      setSelectedIds((current) => {
        const next = new Set(multi ? current : []);

        if (range && lastSelectedId) {
          const ids = rows.map((row) => row.id);
          const start = ids.indexOf(lastSelectedId);
          const end = ids.indexOf(rowId);
          if (start !== -1 && end !== -1) {
            const [from, to] = start < end ? [start, end] : [end, start];
            for (let index = from; index <= to; index += 1) {
              next.add(ids[index]!);
            }
          }
        } else if (multi) {
          if (next.has(rowId)) {
            next.delete(rowId);
          } else {
            next.add(rowId);
          }
        } else {
          next.clear();
          next.add(rowId);
        }

        return next;
      });
      setLastSelectedId(rowId);
    },
    [lastSelectedId, rows]
  );

  const resolveTargetWbsId = useCallback((): string | null => {
    if (wbsFilter !== 'all') {
      return wbsFilter;
    }
    return wbsOptions[0]?.id ?? null;
  }, [wbsFilter, wbsOptions]);

  const handleAddItem = useCallback(async () => {
    const wbsId = resolveTargetWbsId();
    if (!wbsId) {
      showStatus('Select a WBS node before adding items.');
      return;
    }

    const result = await createBoqItemAction({
      project_id: projectId,
      wbs_id: wbsId,
      description: 'New item',
      unit: 'item',
    });

    if (!result.success) {
      showStatus(result.error ?? 'Failed to add item');
      return;
    }

    await reload();
    if (result.itemId) {
      handleStartEdit(result.itemId, 'description');
    }
    showStatus('Item added');
  }, [handleStartEdit, projectId, reload, resolveTargetWbsId, showStatus]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedIds.size === 0) {
      return;
    }

    if (
      !window.confirm(
        `Delete ${selectedIds.size} selected item${selectedIds.size === 1 ? '' : 's'}?`
      )
    ) {
      return;
    }

    const ids = Array.from(selectedIds);
    replaceRows(rows.filter((row) => !selectedIds.has(row.id)));
    setSelectedIds(new Set());

    for (const id of ids) {
      await deleteBoqItemAction(projectId, id);
    }

    await refreshTotals();
    showStatus('Items deleted');
  }, [projectId, refreshTotals, replaceRows, rows, selectedIds, showStatus]);

  const handleDuplicateSelected = useCallback(async () => {
    const targetId = selectedIds.values().next().value as string | undefined;
    if (!targetId) {
      return;
    }

    const result = await duplicateBoqItemAction(projectId, targetId);
    if (!result.success) {
      showStatus(result.error ?? 'Duplicate failed');
      return;
    }

    await reload();
    showStatus('Item duplicated');
  }, [projectId, reload, selectedIds, showStatus]);

  const handleCopySelected = useCallback(() => {
    const copied = rows
      .filter((row) => selectedIds.has(row.id))
      .map(rowToClipboard);

    if (copied.length === 0) {
      showStatus('No rows selected');
      return;
    }

    setClipboard(copied);
    showStatus(`Copied ${copied.length} row${copied.length === 1 ? '' : 's'}`);
  }, [rows, selectedIds, showStatus]);

  const handlePasteRows = useCallback(
    async (rowsToPaste: BoqClipboardRow[]) => {
      if (rowsToPaste.length === 0) {
        showStatus('Nothing to paste');
        return;
      }

      const wbsId = resolveTargetWbsId();
      if (!wbsId) {
        showStatus('Select a WBS node before pasting.');
        return;
      }

      setIsLoading(true);
      const result = await pasteBoqRowsAction(projectId, wbsId, rowsToPaste);
      setIsLoading(false);

      if (!result.success) {
        showStatus(result.error ?? 'Paste failed');
        return;
      }

      await reload();
      showStatus(`Pasted ${result.createdIds.length} row(s)`);
    },
    [projectId, reload, resolveTargetWbsId, showStatus]
  );

  const handlePaste = useCallback(async () => {
    await handlePasteRows(clipboard);
  }, [clipboard, handlePasteRows]);

  const handleBulkPaste = useCallback(
    async (text: string) => {
      const parsed = parseExcelClipboard(text);
      if (parsed.length === 0) {
        showStatus('No valid rows found in clipboard.');
        return;
      }
      await handlePasteRows(parsed);
    },
    [handlePasteRows, showStatus]
  );

  const handleDeleteRow = useCallback(
    async (rowId: string) => {
      if (!window.confirm('Delete this BOQ item?')) {
        return;
      }

      replaceRows(rows.filter((row) => row.id !== rowId));
      const result = await deleteBoqItemAction(projectId, rowId);
      if (!result.success) {
        await reload();
        showStatus(result.error ?? 'Delete failed');
        return;
      }

      await refreshTotals();
      showStatus('Item deleted');
    },
    [projectId, refreshTotals, reload, replaceRows, rows, showStatus]
  );

  useEffect(() => {
    return () => {
      if (searchTimerRef.current !== null) {
        window.clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
      }

      if (
        (event.ctrlKey && event.key === 'y') ||
        (event.ctrlKey && event.shiftKey && event.key === 'z')
      ) {
        event.preventDefault();
        redo();
      }

      if (!canEdit) {
        return;
      }

      if (event.key === 'F2' && selectedIds.size === 1) {
        event.preventDefault();
        const rowId = selectedIds.values().next().value as string;
        const columnId = focusedCell?.columnId ?? 'description';
        handleStartEdit(rowId, columnId);
      }

      if (event.ctrlKey && event.key === 'c') {
        event.preventDefault();
        handleCopySelected();
      }

      if (event.ctrlKey && event.key === 'v') {
        event.preventDefault();
        void handlePaste();
      }

      if (event.key === 'Delete') {
        event.preventDefault();
        void handleDeleteSelected();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    canEdit,
    focusedCell,
    handleCopySelected,
    handleDeleteSelected,
    handlePaste,
    handleStartEdit,
    redo,
    selectedIds,
    undo,
  ]);

  const handleFocusCell = useCallback(
    (rowId: string, columnId: BoqEditableField) => {
      setFocusedCell({ rowId, columnId });
    },
    []
  );

  const handleOpenRateAnalysis = useCallback((rowId: string) => {
    setAnalysisItemId(rowId);
  }, []);

  const handleColumnResize = useCallback((columnId: string, width: number) => {
    setColumns((current) =>
      current.map((column) =>
        column.id === columnId ? { ...column, width } : column
      )
    );
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || isLoadingMore || isLoading || isEditingRef.current) {
      return;
    }
    void reload({ page: page + 1, append: true });
  }, [hasMore, isLoading, isLoadingMore, page, reload]);

  const footerTotals = useMemo(
    () => [
      { label: 'Material Total', value: displayTotals.materialTotal },
      { label: 'Labor Total', value: displayTotals.laborTotal },
      { label: 'Equipment Total', value: displayTotals.equipmentTotal },
      { label: 'Subcontract Total', value: displayTotals.subcontractTotal },
      { label: 'Grand Total', value: displayTotals.grandTotal, emphasis: true },
    ],
    [displayTotals]
  );

  return (
    <div className="space-y-4">
      <ConnectivityBanner onRetry={() => void reload({ page: 1 })} />

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={wbsFilter} onValueChange={handleWbsFilterChange}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="WBS filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All WBS nodes</SelectItem>
              {wbsOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  <span style={{ paddingLeft: `${(option.level - 1) * 12}px` }}>
                    {option.wbs_code} — {option.description}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Search items…"
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <Button type="button" onClick={() => void handleAddItem()}>
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          )}
          {canEdit && (
            <>
              <Button type="button" variant="outline" onClick={handleCopySelected}>
                <Copy className="h-4 w-4" />
                Copy
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void handlePaste()}
                disabled={clipboard.length === 0}
              >
                <ClipboardPaste className="h-4 w-4" />
                Paste
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleDuplicateSelected()}
                disabled={selectedIds.size !== 1}
              >
                <CopyPlus className="h-4 w-4" />
                Duplicate
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleDeleteSelected()}
                disabled={selectedIds.size === 0}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </>
          )}
          <Button type="button" variant="outline" onClick={undo} disabled={!canUndo}>
            <Undo2 className="h-4 w-4" />
            Undo
          </Button>
          <Button type="button" variant="outline" onClick={redo} disabled={!canRedo}>
            <Redo2 className="h-4 w-4" />
            Redo
          </Button>
        </div>
      </div>

      {statusMessage && (
        <p className="text-sm text-muted-foreground" role="status">
          {statusMessage}
        </p>
      )}

      {loadError ? (
        <div
          className="flex flex-col gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <p>{loadError}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void reload({ page: 1 })}
          >
            Retry
          </Button>
        </div>
      ) : null}

      {isLoading ? (
        <TableSkeleton rows={10} columns={8} />
      ) : (
        <BoqGrid
          rows={rows}
          columns={columns}
          currency={currency}
          canEdit={canEdit}
          selectedIds={selectedIds}
          focusedCell={focusedCell}
          editingCell={editingCell}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
          onSelectRow={handleSelectRow}
          onFocusCell={handleFocusCell}
          onStartEdit={handleStartEdit}
          onCellCommit={handleCellCommit}
          onCellCancel={handleCellCancel}
          onDeleteRow={(rowId) => void handleDeleteRow(rowId)}
          onOpenRateAnalysis={handleOpenRateAnalysis}
          onBulkPaste={(text) => void handleBulkPaste(text)}
          onColumnResize={handleColumnResize}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={handleLoadMore}
        />
      )}

      <div className="rounded-lg border bg-muted/30 px-4 py-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {footerTotals.map((item) => (
            <div key={item.label} className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {item.label}
              </p>
              <p
                className={
                  item.emphasis
                    ? 'text-lg font-semibold tabular-nums'
                    : 'text-sm font-medium tabular-nums'
                }
              >
                {formatCurrency(item.value, currency)}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-sm text-muted-foreground">
          {activeWbsId && (
            <span>
              WBS Subtotal:{' '}
              <strong className="text-foreground">
                {formatCurrency(totals.wbsSubtotal, currency)}
              </strong>
            </span>
          )}
          <span>
            Project Total:{' '}
            <strong className="text-foreground">
              {formatCurrency(totals.projectTotal, currency)}
            </strong>
          </span>
          <span>
            Showing {rows.length.toLocaleString()} of {totalCount.toLocaleString()}{' '}
            item{totalCount === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {canEdit && (
        <p className="text-xs text-muted-foreground">
          Double-click to edit · Tab / Enter navigate · Esc cancel · Saves on blur
          · Paste Excel rows from clipboard · Ctrl+C/V copy/paste · Calculator icon
          opens Rate Analysis
        </p>
      )}

      <RateAnalysisDialog
        open={analysisItemId !== null}
        projectId={projectId}
        boqItemId={analysisItemId}
        currency={currency}
        canEdit={canEdit}
        onClose={() => setAnalysisItemId(null)}
        onSaved={() => void reload({ page: 1 })}
      />
    </div>
  );
}
