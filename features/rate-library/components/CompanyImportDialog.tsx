'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TableSkeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/format-currency';
import {
  COMPANY_IMPORT_PAGE_SIZE,
  PROJECT_RATE_ROW_HEIGHT,
  RATE_LIBRARY_SEARCH_DEBOUNCE_MS,
} from '@/lib/performance/constants';
import { cn } from '@/lib/utils';
import { loadRateLibraryAction } from '@/services/rate-library/rate-library-actions';
import {
  importCompanyResourcesByFilterAction,
  importCompanyResourcesToProjectAction,
} from '@/services/project-rate-library/project-rate-library-actions';
import type { CurrencyCode } from '@/types/project';
import type {
  RateLibraryCategory,
  RateLibraryItem,
} from '@/types/rate-library';
import {
  RATE_LIBRARY_CATEGORIES,
  RATE_LIBRARY_CATEGORY_LABELS,
} from '@/types/rate-library';

interface CompanyImportDialogProps {
  open: boolean;
  projectId: string;
  currency: CurrencyCode;
  onOpenChange: (open: boolean) => void;
  onImported: (importedCount: number) => void;
}

export function CompanyImportDialog({
  open,
  projectId,
  currency,
  onOpenChange,
  onImported,
}: CompanyImportDialogProps): React.JSX.Element {
  const [items, setItems] = useState<RateLibraryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<RateLibraryCategory | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimerRef = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const load = useCallback(
    async (overrides?: {
      search?: string;
      category?: RateLibraryCategory | 'all';
      page?: number;
    }) => {
      setIsLoading(true);
      setError(null);
      const nextSearch = overrides?.search ?? search;
      const nextCategory = overrides?.category ?? category;
      const nextPage = overrides?.page ?? page;
      const result = await loadRateLibraryAction({
        search: nextSearch,
        category: nextCategory,
        page: nextPage,
        pageSize: COMPANY_IMPORT_PAGE_SIZE,
        activeOnly: true,
      });
      setItems(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setPage(result.page);
      setIsLoading(false);
    },
    [category, page, search]
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setSelectedIds(new Set());
    setSearch('');
    setCategory('all');
    setPage(1);
    void load({ search: '', category: 'all', page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when dialog opens
  }, [open]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimerRef.current !== null) {
      window.clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = window.setTimeout(() => {
      void load({ search: value, page: 1 });
    }, RATE_LIBRARY_SEARCH_DEBOUNCE_MS);
  };

  const allVisibleSelected =
    items.length > 0 && items.every((item) => selectedIds.has(item.id));

  const toggleSelectAllVisible = (checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const item of items) {
        if (checked) {
          next.add(item.id);
        } else {
          next.delete(item.id);
        }
      }
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => PROJECT_RATE_ROW_HEIGHT,
    overscan: 12,
  });

  const handleImportSelected = async () => {
    if (selectedIds.size === 0) {
      setError('Select at least one resource to import.');
      return;
    }
    setIsImporting(true);
    setError(null);
    const result = await importCompanyResourcesToProjectAction(
      projectId,
      Array.from(selectedIds)
    );
    setIsImporting(false);
    if (!result.success) {
      setError(result.error ?? 'Import failed.');
      return;
    }
    onImported(result.importedCount ?? 0);
    onOpenChange(false);
  };

  const handleImportAll = async () => {
    if (
      !window.confirm(
        total > 0
          ? `Import all ${total.toLocaleString()} matching company resource(s) into this project?`
          : 'Import all matching company resources into this project?'
      )
    ) {
      return;
    }
    setIsImporting(true);
    setError(null);
    const result = await importCompanyResourcesByFilterAction(projectId, {
      category,
      search,
      activeOnly: true,
    });
    setIsImporting(false);
    if (!result.success) {
      setError(result.error ?? 'Import All failed.');
      return;
    }
    onImported(result.importedCount ?? 0);
    onOpenChange(false);
  };

  const virtualItems = rowVirtualizer.getVirtualItems();
  const selectedCount = selectedIds.size;

  const headerNote = useMemo(
    () =>
      `${total.toLocaleString()} company resource${total === 1 ? '' : 's'} match filters`,
    [total]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-4xl flex-col gap-4 overflow-hidden">
        <DialogHeader>
          <DialogTitle>Import from Company Resource Library</DialogTitle>
          <DialogDescription>
            Select master resources to copy into this project. Project edits will
            not change the company library.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search code or description…"
            className="sm:flex-1"
          />
          <Select
            value={category}
            onValueChange={(value) => {
              const next = value as RateLibraryCategory | 'all';
              setCategory(next);
              void load({ category: next, page: 1 });
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {RATE_LIBRARY_CATEGORIES.map((value) => (
                <SelectItem key={value} value={value}>
                  {RATE_LIBRARY_CATEGORY_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <label className="flex items-center gap-2 text-foreground">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 accent-primary"
              checked={allVisibleSelected}
              onChange={(event) => toggleSelectAllVisible(event.target.checked)}
            />
            Select All (this page)
          </label>
          <span>
            {headerNote} · {selectedCount} selected
          </span>
        </div>

        <div
          ref={listRef}
          className="min-h-[320px] flex-1 overflow-auto rounded-md border"
        >
          {isLoading && items.length === 0 ? (
            <div className="p-4">
              <TableSkeleton rows={8} columns={5} />
            </div>
          ) : items.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No company resources match your filters.
            </p>
          ) : (
            <div
              className="relative w-full"
              style={{ height: rowVirtualizer.getTotalSize() }}
            >
              {virtualItems.map((virtualRow) => {
                const item = items[virtualRow.index]!;
                const checked = selectedIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'absolute left-0 top-0 grid w-full grid-cols-[28px_110px_minmax(0,1fr)_110px_80px_110px] items-center gap-2 border-b px-3 text-sm',
                      checked && 'bg-primary/8'
                    )}
                    style={{
                      height: virtualRow.size,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 accent-primary"
                      checked={checked}
                      onChange={() => toggleOne(item.id)}
                      aria-label={`Select ${item.code}`}
                    />
                    <span className="truncate font-mono text-xs">{item.code}</span>
                    <span className="truncate">{item.description}</span>
                    <span className="truncate text-muted-foreground">
                      {RATE_LIBRARY_CATEGORY_LABELS[item.category]}
                    </span>
                    <span className="truncate text-muted-foreground">
                      {item.unit}
                    </span>
                    <span className="truncate text-right font-medium">
                      {formatCurrency(item.unit_cost, currency)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || isLoading || isImporting}
            onClick={() => void load({ page: page - 1 })}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages || isLoading || isImporting}
            onClick={() => void load({ page: page + 1 })}
          >
            Next
          </Button>
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={isImporting || isLoading || total === 0}
            onClick={() => void handleImportAll()}
          >
            {isImporting ? 'Importing…' : 'Import All'}
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isImporting}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isImporting || selectedCount === 0}
              onClick={() => void handleImportSelected()}
            >
              {isImporting
                ? 'Importing…'
                : `Import Selected (${selectedCount})`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
