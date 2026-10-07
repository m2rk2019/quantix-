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

export interface LookupColumn<T> {
  key: keyof T | string;
  label: string;
  align?: 'left' | 'right' | 'center';
  render?: (item: T) => React.ReactNode;
  editable?: boolean;
  editType?: 'text' | 'number';
  onBlur?: (item: T, value: string) => void | Promise<void>;
}

interface LookupTableModuleProps<T extends { id: string; is_active: boolean }> {
  title: string;
  canEdit: boolean;
  initialItems: T[];
  initialPage: number;
  initialTotalPages: number;
  columns: LookupColumn<T>[];
  onLoad: (params: {
    search?: string;
    activeOnly?: boolean;
    page?: number;
  }) => Promise<{ items: T[]; totalPages: number }>;
  onAdd: () => Promise<{ success: boolean; error?: string }>;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
  onImport: (text: string) => Promise<{ success: boolean; error?: string; imported?: number }>;
  onExport: (format: 'csv' | 'xlsx') => Promise<{
    filename: string;
    mimeType: string;
    content: string;
    encoding?: 'base64';
  }>;
}

export function LookupTableModule<T extends { id: string; is_active: boolean }>({
  title,
  canEdit,
  initialItems,
  initialPage,
  initialTotalPages,
  columns,
  onLoad,
  onAdd,
  onDelete,
  onImport,
  onExport,
}: LookupTableModuleProps<T>): React.JSX.Element {
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
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
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search…"
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
              <Button type="button" onClick={() => void onAdd().then((result) => {
                if (!result.success) {
                  showStatus(result.error ?? 'Failed to add');
                  return;
                }
                void load({ page: 1 });
                showStatus('Record added');
              })}>
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
                      showStatus(`Imported ${result.imported ?? 0} row(s)`);
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
        <TableSkeleton rows={8} columns={columns.length + (canEdit ? 1 : 0)} />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={`px-3 py-2 ${
                      column.align === 'right'
                        ? 'text-right'
                        : column.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                    }`}
                  >
                    {column.label}
                  </th>
                ))}
                {canEdit && <th className="px-3 py-2" />}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (canEdit ? 1 : 0)}
                    className="px-3 py-10 text-center text-muted-foreground"
                  >
                    No records found.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-t">
                    {columns.map((column) => (
                      <td
                        key={String(column.key)}
                        className={`px-3 py-2 ${
                          column.align === 'right'
                            ? 'text-right tabular-nums'
                            : column.align === 'center'
                              ? 'text-center'
                              : ''
                        }`}
                      >
                        {column.render ? (
                          column.render(item)
                        ) : column.editable && canEdit ? (
                          <Input
                            defaultValue={String(
                              (item as Record<string, unknown>)[column.key as string] ?? ''
                            )}
                            className={`h-8 ${column.align === 'right' ? 'text-right' : ''}`}
                            onBlur={(event) => {
                              void column.onBlur?.(item, event.target.value);
                            }}
                          />
                        ) : (
                          String((item as Record<string, unknown>)[column.key as string] ?? '')
                        )}
                      </td>
                    ))}
                    <td className="px-2 py-1 text-right">
                      {canEdit && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => {
                            if (!window.confirm('Deactivate this record?')) {
                              return;
                            }
                            void onDelete(item.id).then((result) => {
                              if (!result.success) {
                                showStatus(result.error ?? 'Delete failed');
                                return;
                              }
                              void load();
                              showStatus('Record deactivated');
                            });
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </td>
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
