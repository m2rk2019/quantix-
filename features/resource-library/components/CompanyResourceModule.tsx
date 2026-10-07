'use client';

import { Download, Plus, Trash2, Upload } from 'lucide-react';
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
import { downloadBase64File, downloadTextFile } from '@/lib/resource-library/download-client';
import { formatCurrency } from '@/lib/format-currency';
import type { RateLibraryCategory } from '@/types/rate-library';
import { RATE_LIBRARY_CATEGORY_LABELS } from '@/types/rate-library';
import type {
  CompanyResourceCategory,
  CompanyResourceItem,
  CompanySupplier,
  CompanyUnit,
  PaginatedResult,
} from '@/types/resource-library';
import type { CurrencyCode } from '@/types/project';

interface CompanyResourceModuleProps {
  category: RateLibraryCategory;
  title: string;
  canEdit: boolean;
  currency: CurrencyCode;
  initialData: PaginatedResult<CompanyResourceItem>;
  lookups: {
    suppliers: CompanySupplier[];
    units: CompanyUnit[];
    categories: CompanyResourceCategory[];
  };
  onLoad: (params: {
    search?: string;
    activeOnly?: boolean;
    page?: number;
  }) => Promise<PaginatedResult<CompanyResourceItem>>;
  onAdd: () => Promise<{ success: boolean; error?: string }>;
  onUpdate: (
    id: string,
    patch: Record<string, string | number | boolean | null>
  ) => Promise<{ success: boolean; error?: string }>;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
  onImport: (text: string) => Promise<{ success: boolean; error?: string; imported?: number }>;
  onExport: (format: 'csv' | 'xlsx') => Promise<{
    filename: string;
    mimeType: string;
    content: string;
    encoding?: 'base64';
  }>;
}

export function CompanyResourceModule({
  category,
  title,
  canEdit,
  currency,
  initialData,
  lookups,
  onLoad,
  onAdd,
  onUpdate,
  onDelete,
  onImport,
  onExport,
}: CompanyResourceModuleProps): React.JSX.Element {
  const [items, setItems] = useState(initialData.items);
  const [search, setSearch] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [page, setPage] = useState(initialData.page);
  const [totalPages, setTotalPages] = useState(initialData.totalPages);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<number | null>(null);

  const showStatus = (message: string) => {
    setStatus(message);
    window.setTimeout(() => setStatus(null), 2500);
  };

  const load = useCallback(
    async (overrides?: { search?: string; activeOnly?: boolean; page?: number }) => {
      setIsLoading(true);
      const result = await onLoad({
        search: overrides?.search ?? search,
        activeOnly: overrides?.activeOnly ?? activeOnly,
        page: overrides?.page ?? page,
      });
      setItems(result.items);
      setTotalPages(result.totalPages);
      setIsLoading(false);
    },
    [activeOnly, onLoad, page, search]
  );

  const handleExport = async (format: 'csv' | 'xlsx') => {
    const result = await onExport(format);
    if (result.encoding === 'base64') {
      downloadBase64File(result.filename, result.content, result.mimeType);
      return;
    }
    downloadTextFile(result.filename, result.content, result.mimeType);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={search}
            onChange={(event) => {
              const value = event.target.value;
              setSearch(value);
              setPage(1);
              if (searchTimerRef.current !== null) {
                window.clearTimeout(searchTimerRef.current);
              }
              searchTimerRef.current = window.setTimeout(() => {
                void load({ search: value, page: 1 });
              }, 300);
            }}
            placeholder="Search code or description…"
            className="w-full sm:w-64"
          />
          <Select
            value={activeOnly ? 'active' : 'all'}
            onValueChange={(value) => {
              const next = value === 'active';
              setActiveOnly(next);
              setPage(1);
              void load({ activeOnly: next, page: 1 });
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active only</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" onClick={() => void handleExport('csv')}>
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button type="button" variant="outline" onClick={() => void handleExport('xlsx')}>
            <Download className="h-4 w-4" />
            Excel
          </Button>
          {canEdit && (
            <>
              <Button
                type="button"
                onClick={() =>
                  void onAdd().then((result) => {
                    if (!result.success) {
                      showStatus(result.error ?? 'Failed to add');
                      return;
                    }
                    void load({ page: 1 });
                    showStatus('Resource added');
                  })
                }
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Import
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.txt,.xlsx"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    return;
                  }
                  void file.text().then((text) =>
                    onImport(text).then((result) => {
                      if (!result.success) {
                        showStatus(result.error ?? 'Import failed');
                        return;
                      }
                      void load({ page: 1 });
                      showStatus(`Imported ${result.imported ?? 0} resource(s)`);
                    })
                  );
                  event.target.value = '';
                }}
              />
            </>
          )}
        </div>
      </div>

      {status && (
        <p className="text-sm text-muted-foreground" role="status">
          {status}
        </p>
      )}

      {isLoading ? (
        <TableSkeleton rows={8} columns={8} />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Code</th>
                <th className="px-3 py-2 text-left">Description</th>
                <th className="px-3 py-2 text-left">Unit</th>
                <th className="px-3 py-2 text-right">Unit Cost</th>
                <th className="px-3 py-2 text-left">Supplier</th>
                <th className="px-3 py-2 text-left">Category</th>
                <th className="px-3 py-2 text-center">Status</th>
                {canEdit && <th className="px-3 py-2" />}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={canEdit ? 8 : 7}
                    className="px-3 py-10 text-center text-muted-foreground"
                  >
                    No {RATE_LIBRARY_CATEGORY_LABELS[category].toLowerCase()} resources found.
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
                              void onUpdate(item.id, { description: value }).then(() => load());
                            }
                          }}
                        />
                      ) : (
                        item.description
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {canEdit ? (
                        <Select
                          defaultValue={item.unit_id ?? 'custom'}
                          onValueChange={(value) => {
                            if (value === 'custom') {
                              return;
                            }
                            void onUpdate(item.id, { unit_id: value }).then(() => load());
                          }}
                        >
                          <SelectTrigger className="h-8 w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {lookups.units.map((unit) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.symbol}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        item.unit_symbol ?? item.unit
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {canEdit ? (
                        <Input
                          defaultValue={item.unit_cost.toFixed(2)}
                          className="h-8 text-right"
                          onBlur={(event) => {
                            const value = Number(event.target.value);
                            if (Number.isFinite(value) && value !== item.unit_cost) {
                              void onUpdate(item.id, { unit_cost: value }).then(() => load());
                            }
                          }}
                        />
                      ) : (
                        formatCurrency(item.unit_cost, currency)
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {canEdit ? (
                        <Select
                          value={item.supplier_id ?? 'none'}
                          onValueChange={(value) => {
                            void onUpdate(item.id, {
                              supplier_id: value === 'none' ? null : value,
                            }).then(() => load());
                          }}
                        >
                          <SelectTrigger className="h-8 w-36">
                            <SelectValue placeholder="Supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {lookups.suppliers.map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        item.supplier_name ?? '—'
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {canEdit ? (
                        <Select
                          value={item.resource_category_id ?? 'none'}
                          onValueChange={(value) => {
                            void onUpdate(item.id, {
                              resource_category_id: value === 'none' ? null : value,
                            }).then(() => load());
                          }}
                        >
                          <SelectTrigger className="h-8 w-36">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {lookups.categories.map((resourceCategory) => (
                              <SelectItem key={resourceCategory.id} value={resourceCategory.id}>
                                {resourceCategory.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        item.resource_category_name ?? '—'
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={
                          item.is_active ? 'text-emerald-600' : 'text-muted-foreground'
                        }
                      >
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-2 py-1 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => {
                            if (!window.confirm('Deactivate this resource?')) {
                              return;
                            }
                            void onDelete(item.id).then((result) => {
                              if (!result.success) {
                                showStatus(result.error ?? 'Delete failed');
                                return;
                              }
                              void load();
                              showStatus('Resource deactivated');
                            });
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
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
