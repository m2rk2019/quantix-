'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { Library, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

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
import { CompanyImportDialog } from '@/features/rate-library/components/CompanyImportDialog';
import { ProjectRateSyncPanel } from '@/features/rate-library/components/ProjectRateSyncPanel';
import { formatCurrency } from '@/lib/format-currency';
import {
  PROJECT_RATE_PAGE_SIZE,
  PROJECT_RATE_ROW_HEIGHT,
  RATE_LIBRARY_SEARCH_DEBOUNCE_MS,
} from '@/lib/performance/constants';
import { cn } from '@/lib/utils';
import {
  createProjectRateItemAction,
  deleteProjectRateItemAction,
  importCompanyResourcesByFilterAction,
  listProjectRateLibraryAction,
  updateProjectRateItemAction,
} from '@/services/project-rate-library/project-rate-library-actions';
import type { CurrencyCode } from '@/types/project';
import type {
  ProjectRateLibraryItem,
  ProjectRateLibraryListResult,
} from '@/types/project-rate-library';
import type { RateLibraryCategory } from '@/types/rate-library';
import {
  RATE_LIBRARY_CATEGORIES,
  RATE_LIBRARY_CATEGORY_LABELS,
} from '@/types/rate-library';

interface ProjectRateLibraryModuleProps {
  projectId: string;
  canEdit: boolean;
  currency: CurrencyCode;
  initialProjectData: ProjectRateLibraryListResult;
  companyResourceCount: number;
}

export function ProjectRateLibraryModule({
  projectId,
  canEdit,
  currency,
  initialProjectData,
  companyResourceCount,
}: ProjectRateLibraryModuleProps): React.JSX.Element {
  const router = useRouter();
  const [items, setItems] = useState<ProjectRateLibraryItem[]>(
    initialProjectData.items
  );
  const [projectTotal, setProjectTotal] = useState(initialProjectData.total);
  const [companyTotal] = useState(companyResourceCount);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<RateLibraryCategory | 'all'>('all');
  const [page, setPage] = useState(initialProjectData.page);
  const [totalPages, setTotalPages] = useState(initialProjectData.totalPages);
  const [isLoading, setIsLoading] = useState(false);
  const [isImportingAll, setIsImportingAll] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [syncKey, setSyncKey] = useState(0);
  const [showSyncPanel, setShowSyncPanel] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editUnitCost, setEditUnitCost] = useState('');
  const searchTimerRef = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const showStatus = useCallback((message: string) => {
    setStatus(message);
    window.setTimeout(() => setStatus(null), 2800);
  }, []);

  const load = useCallback(
    async (overrides?: {
      search?: string;
      category?: RateLibraryCategory | 'all';
      page?: number;
    }) => {
      setIsLoading(true);
      const nextSearch = overrides?.search ?? search;
      const nextCategory = overrides?.category ?? category;
      const nextPage = overrides?.page ?? page;
      const result = await listProjectRateLibraryAction({
        projectId,
        search: nextSearch,
        category: nextCategory,
        page: nextPage,
        pageSize: PROJECT_RATE_PAGE_SIZE,
        activeOnly: false,
      });
      setItems(result.items);
      setProjectTotal(result.total);
      setTotalPages(result.totalPages);
      setPage(result.page);
      setIsLoading(false);
    },
    [category, page, projectId, search]
  );

  useEffect(() => {
    return () => {
      if (searchTimerRef.current !== null) {
        window.clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimerRef.current !== null) {
      window.clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = window.setTimeout(() => {
      void load({ search: value, page: 1 });
    }, RATE_LIBRARY_SEARCH_DEBOUNCE_MS);
  };

  const handleAddCustom = async () => {
    const result = await createProjectRateItemAction({
      project_id: projectId,
      code: `PRJ-${Date.now().toString().slice(-6)}`,
      description: 'Custom project resource',
      unit: 'item',
      unit_cost: 0,
      category: 'material',
      is_active: true,
    });
    if (!result.success) {
      showStatus(result.error ?? 'Failed to add custom resource');
      return;
    }
    await load({ page: 1 });
    setSyncKey((value) => value + 1);
    showStatus('Custom resource added');
  };

  const handleImportAll = async () => {
    if (
      !window.confirm(
        companyTotal > 0
          ? `Import all ${companyTotal.toLocaleString()} company resource(s) into this project? Already-imported items will be skipped.`
          : 'Import all company resources into this project?'
      )
    ) {
      return;
    }
    setIsImportingAll(true);
    const result = await importCompanyResourcesByFilterAction(projectId, {
      category: 'all',
      search: '',
      activeOnly: true,
    });
    setIsImportingAll(false);
    if (!result.success) {
      showStatus(result.error ?? 'Import All failed');
      return;
    }
    await load({ page: 1 });
    setSyncKey((value) => value + 1);
    const imported = result.importedCount ?? 0;
    showStatus(
      imported > 0
        ? `Imported ${imported} resource${imported === 1 ? '' : 's'}`
        : 'No new resources imported (already present)'
    );
  };

  const handleDelete = async (itemId: string) => {
    if (!window.confirm('Remove this project resource?')) {
      return;
    }
    const result = await deleteProjectRateItemAction(projectId, itemId);
    if (!result.success) {
      showStatus(result.error ?? 'Delete failed');
      return;
    }
    await load();
    setSyncKey((value) => value + 1);
    showStatus('Resource removed');
  };

  const beginEdit = (item: ProjectRateLibraryItem) => {
    if (!canEdit) {
      return;
    }
    setEditingId(item.id);
    setEditDescription(item.description);
    setEditUnitCost(String(item.unit_cost));
  };

  const saveEdit = async (item: ProjectRateLibraryItem) => {
    const unitCost = Number(editUnitCost);
    if (Number.isNaN(unitCost) || unitCost < 0) {
      showStatus('Unit cost must be a number >= 0');
      return;
    }
    const result = await updateProjectRateItemAction(projectId, item.id, {
      description: editDescription.trim() || item.description,
      unit_cost: unitCost,
    });
    if (!result.success) {
      showStatus(result.error ?? 'Update failed');
      return;
    }
    setEditingId(null);
    await load();
    setSyncKey((value) => value + 1);
    router.refresh();
    showStatus('Project rate updated');
  };

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => PROJECT_RATE_ROW_HEIGHT,
    overscan: 14,
  });

  const isEmpty = !isLoading && projectTotal === 0 && !search && category === 'all';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <p className="rounded-md border bg-card px-3 py-2">
          Project Resources:{' '}
          <span className="font-semibold">{projectTotal.toLocaleString()}</span>{' '}
          items
        </p>
        <p className="rounded-md border bg-card px-3 py-2">
          Company Resources:{' '}
          <span className="font-semibold">{companyTotal.toLocaleString()}</span>{' '}
          items
        </p>
      </div>

      {showSyncPanel ? (
        <ProjectRateSyncPanel
          projectId={projectId}
          currency={currency}
          refreshKey={syncKey}
          onSynced={() => {
            void load();
            showStatus('Project rates synced from company library');
          }}
        />
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search project resources…"
            className="w-full sm:w-72"
          />
          <Select
            value={category}
            onValueChange={(value) => {
              const next = value as RateLibraryCategory | 'all';
              setCategory(next);
              void load({ category: next, page: 1 });
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
        </div>

        {canEdit ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => setImportOpen(true)}>
              <Library className="h-4 w-4" />
              Import from Company Resource Library
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isImportingAll || companyTotal === 0}
              onClick={() => void handleImportAll()}
            >
              {isImportingAll ? 'Importing…' : 'Import All'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowSyncPanel(true);
                setSyncKey((value) => value + 1);
              }}
            >
              <RefreshCw className="h-4 w-4" />
              Sync Updates
            </Button>
            <Button type="button" variant="outline" onClick={() => void handleAddCustom()}>
              <Plus className="h-4 w-4" />
              Add Custom Resource
            </Button>
          </div>
        ) : null}
      </div>

      {status ? (
        <div
          className="rounded-md border border-border bg-card px-3 py-2 text-sm font-medium"
          role="status"
        >
          {status}
        </div>
      ) : null}

      {isEmpty ? (
        <div className="rounded-lg border border-dashed px-6 py-16 text-center">
          <p className="text-base font-medium text-foreground">
            No resources imported yet.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            This project Rate Library starts empty. Import from the Company
            Resource Library or add a custom resource.
          </p>
          {canEdit ? (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button type="button" onClick={() => setImportOpen(true)}>
                <Library className="h-4 w-4" />
                Import from Company Resource Library
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleAddCustom()}
              >
                <Plus className="h-4 w-4" />
                Add Custom Resource
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border">
            <div className="grid grid-cols-[110px_minmax(0,1fr)_120px_80px_120px_100px_48px] gap-2 border-b bg-muted/50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Code</span>
              <span>Description</span>
              <span>Category</span>
              <span>Unit</span>
              <span className="text-right">Unit Cost</span>
              <span>Source</span>
              <span />
            </div>

            {isLoading && items.length === 0 ? (
              <div className="p-4">
                <TableSkeleton rows={8} columns={6} />
              </div>
            ) : (
              <div
                ref={listRef}
                className="max-h-[min(70vh,720px)] overflow-auto"
              >
                <div
                  className="relative w-full"
                  style={{ height: rowVirtualizer.getTotalSize() }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const item = items[virtualRow.index]!;
                    const isEditing = editingId === item.id;
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'absolute left-0 top-0 grid w-full grid-cols-[110px_minmax(0,1fr)_120px_80px_120px_100px_48px] items-center gap-2 border-b px-3 text-sm',
                          virtualRow.index % 2 === 1 && 'bg-muted/20'
                        )}
                        style={{
                          height: virtualRow.size,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        onDoubleClick={() => beginEdit(item)}
                      >
                        <span className="truncate font-mono text-xs">
                          {item.code}
                        </span>
                        {isEditing ? (
                          <Input
                            value={editDescription}
                            onChange={(event) =>
                              setEditDescription(event.target.value)
                            }
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                void saveEdit(item);
                              }
                              if (event.key === 'Escape') {
                                setEditingId(null);
                              }
                            }}
                            className="h-8"
                            autoFocus
                          />
                        ) : (
                          <span className="truncate">{item.description}</span>
                        )}
                        <span className="truncate text-muted-foreground">
                          {RATE_LIBRARY_CATEGORY_LABELS[item.category]}
                        </span>
                        <span className="truncate text-muted-foreground">
                          {item.unit}
                        </span>
                        {isEditing ? (
                          <Input
                            value={editUnitCost}
                            onChange={(event) =>
                              setEditUnitCost(event.target.value)
                            }
                            onBlur={() => void saveEdit(item)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                void saveEdit(item);
                              }
                              if (event.key === 'Escape') {
                                setEditingId(null);
                              }
                            }}
                            className="h-8 text-right"
                          />
                        ) : (
                          <span className="truncate text-right font-medium">
                            {formatCurrency(item.unit_cost, currency)}
                          </span>
                        )}
                        <span className="truncate text-xs text-muted-foreground">
                          {item.is_custom ? 'Custom' : 'Imported'}
                        </span>
                        {canEdit ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            aria-label={`Delete ${item.code}`}
                            onClick={() => void handleDelete(item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <span />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || isLoading}
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
              disabled={page >= totalPages || isLoading}
              onClick={() => void load({ page: page + 1 })}
            >
              Next
            </Button>
          </div>
        </>
      )}

      <CompanyImportDialog
        open={importOpen}
        projectId={projectId}
        currency={currency}
        onOpenChange={setImportOpen}
        onImported={(importedCount) => {
          void load({ page: 1 });
          setSyncKey((value) => value + 1);
          showStatus(
            importedCount > 0
              ? `Imported ${importedCount} resource${importedCount === 1 ? '' : 's'}`
              : 'No new resources imported (already present)'
          );
        }}
      />
    </div>
  );
}
