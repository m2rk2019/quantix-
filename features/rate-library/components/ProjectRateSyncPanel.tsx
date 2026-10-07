'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { RefreshCw } from 'lucide-react';
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
import { formatCurrency } from '@/lib/format-currency';
import { PROJECT_RATE_ROW_HEIGHT } from '@/lib/performance/constants';
import { cn } from '@/lib/utils';
import {
  detectStaleProjectRatesAction,
  ignoreProjectRateCompanyUpdatesAction,
  syncProjectRatesFromCompanyAction,
} from '@/services/project-rate-library/project-rate-library-actions';
import type { CurrencyCode } from '@/types/project';
import type { ProjectRateStaleItem } from '@/types/project-rate-library';
import { RATE_LIBRARY_CATEGORY_LABELS } from '@/types/rate-library';

interface ProjectRateSyncPanelProps {
  projectId: string;
  currency: CurrencyCode;
  refreshKey: number;
  onSynced: () => void;
}

export function ProjectRateSyncPanel({
  projectId,
  currency,
  refreshKey,
  onSynced,
}: ProjectRateSyncPanelProps): React.JSX.Element | null {
  const [staleItems, setStaleItems] = useState<ProjectRateStaleItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingMode, setPendingMode] = useState<'all' | 'selected'>('all');
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await detectStaleProjectRatesAction(projectId);
    setIsLoading(false);
    if (result.error) {
      setError(result.error);
      setStaleItems([]);
      return;
    }
    setStaleItems(result.items);
    setSelectedIds(new Set());
  }, [projectId]);

  useEffect(() => {
    void reload();
  }, [reload, refreshKey]);

  const overrideItems = useMemo(
    () =>
      staleItems.filter(
        (item) =>
          item.source_unit_cost !== null &&
          item.project_unit_cost !== item.source_unit_cost
      ),
    [staleItems]
  );

  const targetsForMode = useCallback(
    (mode: 'all' | 'selected') => {
      if (mode === 'all') {
        return staleItems;
      }
      return staleItems.filter((item) => selectedIds.has(item.project_item_id));
    },
    [selectedIds, staleItems]
  );

  const requestSync = (mode: 'all' | 'selected') => {
    const targets = targetsForMode(mode);
    if (targets.length === 0) {
      setError(
        mode === 'selected'
          ? 'Select at least one resource to update.'
          : 'No stale resources to update.'
      );
      return;
    }
    const overridesInScope = targets.filter(
      (item) =>
        item.source_unit_cost !== null &&
        item.project_unit_cost !== item.source_unit_cost
    );
    setPendingMode(mode);
    if (overridesInScope.length > 0) {
      setConfirmOpen(true);
      return;
    }
    void runSync(mode);
  };

  const runSync = async (mode: 'all' | 'selected') => {
    const targets = targetsForMode(mode);
    setIsBusy(true);
    setError(null);
    const result = await syncProjectRatesFromCompanyAction(
      projectId,
      mode === 'all' ? null : targets.map((item) => item.project_item_id)
    );
    setIsBusy(false);
    setConfirmOpen(false);
    if (!result.success) {
      setError(result.error ?? 'Sync failed.');
      return;
    }
    await reload();
    onSynced();
  };

  const handleIgnoreSelected = async () => {
    if (selectedIds.size === 0) {
      setError('Select at least one resource to ignore.');
      return;
    }
    setIsBusy(true);
    setError(null);
    const result = await ignoreProjectRateCompanyUpdatesAction(
      projectId,
      Array.from(selectedIds)
    );
    setIsBusy(false);
    if (!result.success) {
      setError(result.error ?? 'Ignore failed.');
      return;
    }
    await reload();
  };

  const rowVirtualizer = useVirtualizer({
    count: staleItems.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => PROJECT_RATE_ROW_HEIGHT,
    overscan: 8,
  });

  if (!isLoading && staleItems.length === 0 && !error) {
    return null;
  }

  const overrideCount = overrideItems.length;

  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">
            {isLoading
              ? 'Checking company rate updates…'
              : `${staleItems.length} resource${staleItems.length === 1 ? '' : 's'} have updated company rates.`}
          </p>
          {overrideCount > 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {overrideCount} of these have project-specific rates that differ
              from the imported company snapshot. Sync will overwrite them only
              after confirmation.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isBusy || isLoading}
            onClick={() => void reload()}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isBusy || selectedIds.size === 0}
            onClick={() => void handleIgnoreSelected()}
          >
            Ignore Selected
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isBusy || selectedIds.size === 0}
            onClick={() => requestSync('selected')}
          >
            Update Selected
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isBusy || staleItems.length === 0}
            onClick={() => requestSync('all')}
          >
            Update All
          </Button>
        </div>
      </div>

      {error ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {staleItems.length > 0 ? (
        <div
          ref={listRef}
          className="mt-3 max-h-56 overflow-auto rounded-md border bg-background"
        >
          <div
            className="relative w-full"
            style={{ height: rowVirtualizer.getTotalSize() }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const item = staleItems[virtualRow.index]!;
              const isOverride =
                item.source_unit_cost !== null &&
                item.project_unit_cost !== item.source_unit_cost;
              const checked = selectedIds.has(item.project_item_id);
              return (
                <div
                  key={item.project_item_id}
                  className={cn(
                    'absolute left-0 top-0 grid w-full grid-cols-[28px_100px_minmax(0,1fr)_100px_100px_100px] items-center gap-2 border-b px-3 text-xs',
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
                    onChange={() => {
                      setSelectedIds((current) => {
                        const next = new Set(current);
                        if (next.has(item.project_item_id)) {
                          next.delete(item.project_item_id);
                        } else {
                          next.add(item.project_item_id);
                        }
                        return next;
                      });
                    }}
                  />
                  <span className="truncate font-mono">{item.code}</span>
                  <span className="truncate">
                    {item.description}
                    {isOverride ? (
                      <span className="ml-2 text-amber-700 dark:text-amber-400">
                        (override)
                      </span>
                    ) : null}
                  </span>
                  <span className="truncate text-muted-foreground">
                    {RATE_LIBRARY_CATEGORY_LABELS[item.category]}
                  </span>
                  <span className="truncate text-right">
                    {formatCurrency(item.project_unit_cost, currency)}
                  </span>
                  <span className="truncate text-right font-medium">
                    {formatCurrency(item.company_unit_cost, currency)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Overwrite project-specific rates?</DialogTitle>
            <DialogDescription>
              Some selected resources have project rates that differ from the
              company snapshot. Updating will replace those project unit costs
              with current company rates.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isBusy}
              onClick={() => void runSync(pendingMode)}
            >
              {isBusy ? 'Updating…' : 'Update and overwrite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
