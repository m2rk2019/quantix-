'use client';

import { Plus, Star, Trash2, Upload } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TableSkeleton } from '@/components/ui/skeleton';
import { parseRateLibraryExcel } from '@/lib/rate-library/excel-import';
import { formatCurrency } from '@/lib/format-currency';
import {
  createRateLibraryItemAction,
  deleteRateLibraryItemAction,
  importRateLibraryAction,
  loadRateLibraryAction,
  toggleRateLibraryFavoriteAction,
  updateRateLibraryItemAction,
} from '@/services/rate-library/rate-library-actions';
import type {
  RateLibraryCategory,
  RateLibraryItem,
  RateLibraryListResult,
} from '@/types/rate-library';
import {
  RATE_LIBRARY_CATEGORIES,
  RATE_LIBRARY_CATEGORY_LABELS,
} from '@/types/rate-library';
import type { CurrencyCode } from '@/types/project';

interface RateLibraryModuleProps {
  canEdit: boolean;
  currency: CurrencyCode;
  initialData: RateLibraryListResult;
}

export function RateLibraryModule({
  canEdit,
  currency,
  initialData,
}: RateLibraryModuleProps): React.JSX.Element {
  const [items, setItems] = useState<RateLibraryItem[]>(initialData.items);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<RateLibraryCategory | 'all'>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [page, setPage] = useState(initialData.page);
  const [totalPages, setTotalPages] = useState(initialData.totalPages);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<number | null>(null);

  const load = useCallback(
    async (overrides?: {
      search?: string;
      category?: RateLibraryCategory | 'all';
      favoritesOnly?: boolean;
      page?: number;
    }) => {
      setIsLoading(true);
      const nextSearch = overrides?.search ?? search;
      const nextCategory = overrides?.category ?? category;
      const nextFavoritesOnly = overrides?.favoritesOnly ?? favoritesOnly;
      const nextPage = overrides?.page ?? page;
      const result = await loadRateLibraryAction({
        search: nextSearch,
        category: nextCategory,
        favoritesOnly: nextFavoritesOnly,
        page: nextPage,
        pageSize: 50,
        activeOnly: false,
      });
      setItems(result.items);
      setTotalPages(result.totalPages);
      setIsLoading(false);
    },
    [category, favoritesOnly, page, search]
  );

  const showStatus = (message: string) => {
    setStatus(message);
    window.setTimeout(() => setStatus(null), 2500);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    if (searchTimerRef.current !== null) {
      window.clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = window.setTimeout(() => {
      void load({ search: value, page: 1 });
    }, 300);
  };

  const handleAdd = async () => {
    const result = await createRateLibraryItemAction({
      code: `RES-${Date.now().toString().slice(-6)}`,
      description: 'New resource',
      unit: 'item',
      unit_cost: 0,
      category: 'material',
      is_active: true,
    });
    if (!result.success) {
      showStatus(result.error ?? 'Failed to add item');
      return;
    }
    await load();
    showStatus('Resource added');
  };

  const handleToggleFavorite = async (itemId: string) => {
    const result = await toggleRateLibraryFavoriteAction(itemId);
    if (!result.success) {
      showStatus(result.error ?? 'Failed to update favorite');
      return;
    }
    await load();
  };

  const handleDelete = async (itemId: string) => {
    if (!window.confirm('Deactivate this library item?')) {
      return;
    }
    const result = await deleteRateLibraryItemAction(itemId);
    if (!result.success) {
      showStatus(result.error ?? 'Delete failed');
      return;
    }
    await load();
    showStatus('Resource deactivated');
  };

  const handleImportFile = async (file: File) => {
    const text = await file.text();
    const rows = parseRateLibraryExcel(text);
    if (rows.length === 0) {
      showStatus('No valid rows found in file.');
      return;
    }
    const result = await importRateLibraryAction(rows);
    if (!result.success) {
      showStatus(result.error ?? 'Import failed');
      return;
    }
    await load({ page: 1 });
    showStatus(`Imported ${result.imported} resource(s)`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search code or description…"
            className="w-full sm:w-72"
          />
          <Select
            value={category}
            onValueChange={(value) => {
              const nextCategory = value as RateLibraryCategory | 'all';
              setCategory(nextCategory);
              setPage(1);
              void load({ category: nextCategory, page: 1 });
            }}
          >
            <SelectTrigger className="w-[180px]">
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
          <Button
            type="button"
            variant={favoritesOnly ? 'default' : 'outline'}
            onClick={() => {
              const next = !favoritesOnly;
              setFavoritesOnly(next);
              setPage(1);
              void load({ favoritesOnly: next, page: 1 });
            }}
          >
            <Star className="h-4 w-4" />
            Favorites
          </Button>
        </div>

        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void handleAdd()}>
              <Plus className="h-4 w-4" />
              Add Resource
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Import Excel
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.txt,.xlsx"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handleImportFile(file);
                }
                event.target.value = '';
              }}
            />
          </div>
        )}
      </div>

      {status && (
        <p className="text-sm text-muted-foreground" role="status">
          {status}
        </p>
      )}

      {isLoading ? (
        <TableSkeleton rows={8} columns={6} />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Code</th>
                <th className="px-3 py-2 text-left">Description</th>
                <th className="px-3 py-2 text-left">Category</th>
                <th className="px-3 py-2 text-left">Unit</th>
                <th className="px-3 py-2 text-right">Unit Cost</th>
                <th className="px-3 py-2 text-center">Status</th>
                {canEdit && <th className="px-3 py-2" />}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 7 : 6} className="px-3 py-10 text-center text-muted-foreground">
                    No library items found.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-3 py-2 font-mono text-xs">{item.code}</td>
                    <td className="px-3 py-2">
                      {canEdit ? (
                        <Input
                          defaultValue={item.description}
                          className="h-8"
                          onBlur={(event) => {
                            const value = event.target.value.trim();
                            if (value && value !== item.description) {
                              void updateRateLibraryItemAction(item.id, {
                                description: value,
                              }).then(() => load());
                            }
                          }}
                        />
                      ) : (
                        item.description
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {RATE_LIBRARY_CATEGORY_LABELS[item.category]}
                    </td>
                    <td className="px-3 py-2">{item.unit}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {canEdit ? (
                        <Input
                          defaultValue={item.unit_cost.toFixed(2)}
                          className="h-8 text-right"
                          onBlur={(event) => {
                            const value = Number(event.target.value);
                            if (Number.isFinite(value) && value !== item.unit_cost) {
                              void updateRateLibraryItemAction(item.id, {
                                unit_cost: value,
                              }).then(() => load());
                            }
                          }}
                        />
                      ) : (
                        formatCurrency(item.unit_cost, currency)
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={
                          item.is_active
                            ? 'text-emerald-600'
                            : 'text-muted-foreground'
                        }
                      >
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-2 py-1">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => void handleToggleFavorite(item.id)}
                          >
                            <Star
                              className={
                                item.is_favorite
                                  ? 'h-4 w-4 fill-amber-400 text-amber-400'
                                  : 'h-4 w-4'
                              }
                            />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => void handleDelete(item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => {
              const next = page - 1;
              setPage(next);
              void load({ page: next });
            }}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => {
              const next = page + 1;
              setPage(next);
              void load({ page: next });
            }}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
