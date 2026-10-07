'use client';

import { AlertTriangle, Plus, RefreshCw, Star } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { RateAnalysisCostSummary } from '@/features/rate-analysis/components/RateAnalysisCostSummary';
import {
  RateAnalysisSpreadsheet,
  type SpreadsheetLine,
} from '@/features/rate-analysis/components/RateAnalysisSpreadsheet';
import {
  computeCategoryTotals,
  computeDirectCost,
  computeLineAmount,
  computeRateBuildUp,
} from '@/lib/rate-analysis/compute';
import { formatCurrency } from '@/lib/format-currency';
import {
  clearRateOverrideAction,
  getRateAnalysisAction,
  loadProjectAwareRateLibraryAction,
  refreshStaleLibraryRatesAction,
  saveRateAnalysisAction,
} from '@/services/rate-library/rate-library-actions';
import type { ProjectAwareLibraryItem } from '@/types/project-aware-resource';
import type {
  RateBuildUpMarkups,
  RateLibraryCategory,
} from '@/types/rate-library';
import {
  RATE_LIBRARY_CATEGORIES,
  RATE_LIBRARY_CATEGORY_LABELS,
} from '@/types/rate-library';
import type { CurrencyCode } from '@/types/project';

interface RateAnalysisDialogProps {
  open: boolean;
  projectId: string;
  boqItemId: string | null;
  currency: CurrencyCode;
  canEdit: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function newDraftLine(category: RateLibraryCategory): SpreadsheetLine {
  return {
    tempId: crypto.randomUUID(),
    category,
    resource_name: '',
    unit: 'item',
    consumption: 0,
    unit_cost: 0,
    waste_percent: 0,
    productivity: null,
    amount: 0,
    library_item_id: null,
    project_library_item_id: null,
  };
}

interface RateAnalysisBodyProps {
  projectId: string;
  boqItemId: string;
  currency: CurrencyCode;
  canEdit: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function RateAnalysisBody({
  projectId,
  boqItemId,
  currency,
  canEdit,
  onClose,
  onSaved,
}: RateAnalysisBodyProps): React.JSX.Element {
  const [itemCode, setItemCode] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('');
  const [lines, setLines] = useState<SpreadsheetLine[]>([]);
  const [otherCostRate, setOtherCostRate] = useState(0);
  const [markups, setMarkups] = useState<RateBuildUpMarkups>({
    ocm_percent: 0,
    contingency_percent: 0,
    profit_percent: 0,
    vat_percent: 0,
  });
  const [overrides, setOverrides] = useState({
    material_rate_override: false,
    labor_rate_override: false,
    equipment_rate_override: false,
    subcontract_rate_override: false,
  });
  const [activeCategory, setActiveCategory] = useState<RateLibraryCategory>('material');
  const [librarySearch, setLibrarySearch] = useState('');
  const [libraryResults, setLibraryResults] = useState<ProjectAwareLibraryItem[]>(
    []
  );
  const [resourceSource, setResourceSource] = useState<'project' | 'company'>(
    'company'
  );
  const [staleCount, setStaleCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const categoryLines = useMemo(
    () => lines.filter((line) => line.category === activeCategory),
    [activeCategory, lines]
  );

  const categoryTotals = useMemo(() => computeCategoryTotals(lines), [lines]);
  const directCost = useMemo(
    () => computeDirectCost(categoryTotals, otherCostRate),
    [categoryTotals, otherCostRate]
  );
  const buildUp = useMemo(
    () => computeRateBuildUp(directCost, markups),
    [directCost, markups]
  );

  const displayedLibraryResults = librarySearch.trim() ? libraryResults : [];

  const applyAnalysisData = useCallback(
    (data: NonNullable<Awaited<ReturnType<typeof getRateAnalysisAction>>>) => {
      setItemCode(data.itemCode);
      setDescription(data.description);
      setUnit(data.unit);
      setOtherCostRate(data.currentRates.other_cost_rate);
      setMarkups(data.markups);
      setOverrides({
        material_rate_override: data.overrides.material_rate_override,
        labor_rate_override: data.overrides.labor_rate_override,
        equipment_rate_override: data.overrides.equipment_rate_override,
        subcontract_rate_override: data.overrides.subcontract_rate_override,
      });
      setStaleCount(data.staleLineCount);
      setResourceSource(data.resourceSource);
      setLines(
        data.lines.map((line) => ({
          tempId: line.id,
          id: line.id,
          library_item_id: line.library_item_id,
          project_library_item_id: line.project_library_item_id,
          category: line.category,
          resource_name: line.resource_name,
          unit: line.unit,
          consumption: line.consumption,
          unit_cost: line.unit_cost,
          waste_percent: line.waste_percent,
          productivity: line.productivity,
          amount: line.amount,
          sort_order: line.sort_order,
          is_stale: line.is_stale,
        }))
      );
    },
    []
  );

  useEffect(() => {
    let cancelled = false;

    void getRateAnalysisAction(projectId, boqItemId).then((data) => {
      if (cancelled) {
        return;
      }
      setIsLoading(false);
      if (!data) {
        setError('Failed to load rate analysis.');
        return;
      }
      applyAnalysisData(data);
    });

    return () => {
      cancelled = true;
    };
  }, [applyAnalysisData, boqItemId, projectId]);

  useEffect(() => {
    if (!librarySearch.trim()) {
      return;
    }

    const timer = window.setTimeout(() => {
      void loadProjectAwareRateLibraryAction(projectId, {
        search: librarySearch,
        category: activeCategory,
        page: 1,
        pageSize: 8,
        favoritesOnly: false,
        activeOnly: true,
      }).then((result) => {
        setLibraryResults(result.items as ProjectAwareLibraryItem[]);
        setResourceSource(result.source);
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [activeCategory, librarySearch, projectId]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    const result = await saveRateAnalysisAction(projectId, boqItemId, {
      lines: lines.map((line, index) => ({
        id: line.id,
        library_item_id: line.library_item_id,
        project_library_item_id: line.project_library_item_id,
        category: line.category,
        resource_name: line.resource_name,
        unit: line.unit,
        consumption: line.consumption,
        unit_cost: line.unit_cost,
        waste_percent: line.waste_percent,
        productivity: line.productivity,
        sort_order: index,
      })),
      markups,
    });

    setIsSaving(false);

    if (!result.success) {
      setError(result.error ?? 'Save failed.');
      return;
    }

    if (result.warnings?.length) {
      setStatus(result.warnings.join(' '));
    }

    onSaved();
    onClose();
  }, [boqItemId, lines, markups, onClose, onSaved, projectId]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (!canEdit) {
        return;
      }
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        void handleSave();
      }
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canEdit, handleSave, onClose]);

  const mergeCategoryLines = (category: RateLibraryCategory, next: SpreadsheetLine[]) => {
    const other = lines.filter((line) => line.category !== category);
    setLines([...other, ...next]);
  };

  const addLibraryItem = (item: ProjectAwareLibraryItem) => {
    const fromProject = item.source === 'project';
    setLines((current) => [
      ...current,
      {
        tempId: crypto.randomUUID(),
        library_item_id: item.company_library_item_id,
        project_library_item_id: fromProject
          ? item.project_library_item_id
          : null,
        category: item.category,
        resource_name: item.description,
        unit: item.unit,
        consumption: 1,
        unit_cost: item.unit_cost,
        waste_percent: 0,
        productivity: null,
        amount: computeLineAmount(1, item.unit_cost, 0, null),
      },
    ]);
    setLibrarySearch('');
    setLibraryResults([]);
  };

  const handleRefreshStale = async () => {
    const result = await refreshStaleLibraryRatesAction(projectId, boqItemId);
    if (!result.success) {
      setError(result.error ?? 'Failed to refresh library rates.');
      return;
    }
    const data = await getRateAnalysisAction(projectId, boqItemId);
    if (data) {
      applyAnalysisData(data);
      setStatus('Library rates updated. Manually overridden BOQ rates preserved.');
    }
  };

  const handleClearOverride = async (category: RateLibraryCategory) => {
    const result = await clearRateOverrideAction(projectId, boqItemId, category);
    if (!result.success) {
      setError(result.error ?? 'Failed to clear override.');
      return;
    }
    const data = await getRateAnalysisAction(projectId, boqItemId);
    if (data) {
      applyAnalysisData(data);
      onSaved();
    }
  };

  if (isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">Loading rate build-up…</p>;
  }

  const overrideKey = `${activeCategory}_rate_override` as keyof typeof overrides;

  return (
    <>
      <div className="space-y-3 border-b px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-muted-foreground">{itemCode}</p>
            <p className="font-medium">{description}</p>
            <p className="text-sm text-muted-foreground">BOQ unit: {unit}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {RATE_LIBRARY_CATEGORIES.map((category) => (
              <Button
                key={category}
                type="button"
                size="sm"
                variant={activeCategory === category ? 'default' : 'outline'}
                onClick={() => setActiveCategory(category)}
              >
                {RATE_LIBRARY_CATEGORY_LABELS[category]}
              </Button>
            ))}
          </div>
        </div>

        {staleCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              {staleCount} resource line(s) use outdated{' '}
              {resourceSource === 'project' ? 'project' : 'company'} library rates.
            </span>
            {canEdit && (
              <Button type="button" size="sm" variant="outline" onClick={() => void handleRefreshStale()}>
                <RefreshCw className="h-3.5 w-3.5" />
                Update from Library
              </Button>
            )}
          </div>
        )}

        {canEdit && (
          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {resourceSource === 'project'
                ? 'Project Resource Library'
                : 'Company Resource Library (fallback)'}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={librarySearch}
                onChange={(event) => setLibrarySearch(event.target.value)}
                placeholder={`Search ${RATE_LIBRARY_CATEGORY_LABELS[activeCategory].toLowerCase()}…`}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setLines((current) => [...current, newDraftLine(activeCategory)])}
              >
                <Plus className="h-4 w-4" />
                Manual Row
              </Button>
            </div>
            {displayedLibraryResults.length > 0 && (
              <div className="mt-2 max-h-32 overflow-auto rounded-md border bg-background">
                {displayedLibraryResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                    onClick={() => addLibraryItem(item)}
                  >
                    <span>
                      <span className="font-mono text-xs text-muted-foreground">{item.code}</span>{' '}
                      {item.description}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatCurrency(item.unit_cost, currency)}/{item.unit}
                      {item.is_favorite && (
                        <Star className="ml-1 inline h-3 w-3 fill-amber-400 text-amber-400" />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="font-medium">
            {RATE_LIBRARY_CATEGORY_LABELS[activeCategory]} subtotal:{' '}
            <span className="tabular-nums">
              {formatCurrency(categoryTotals[activeCategory], currency)}
            </span>
          </span>
          {overrides[overrideKey] && (
            <div className="flex items-center gap-2">
              <span className="rounded bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700">
                Category overridden in BOQ
              </span>
              {canEdit && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void handleClearOverride(activeCategory)}
                >
                  Sync
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 lg:flex-row">
        <div className="min-h-0 min-w-0 flex-1 overflow-auto">
          <RateAnalysisSpreadsheet
            lines={categoryLines}
            currency={currency}
            canEdit={canEdit}
            onChange={(next) => mergeCategoryLines(activeCategory, next)}
          />
        </div>
        <RateAnalysisCostSummary
          currency={currency}
          categoryTotals={categoryTotals}
          otherCostRate={otherCostRate}
          buildUp={buildUp}
          markups={markups}
          canEdit={canEdit}
          onMarkupChange={(field, value) =>
            setMarkups((current) => ({ ...current, [field]: value }))
          }
        />
      </div>

      {(error || status) && (
        <div className="border-t px-4 py-2">
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {status && (
            <p className="text-sm text-muted-foreground" role="status">
              {status}
            </p>
          )}
        </div>
      )}

      <DialogFooter className="border-t px-4 py-3">
        <p className="mr-auto hidden text-xs text-muted-foreground sm:block">
          Ctrl+S save · Esc close · Paste Excel rows into grid
        </p>
        <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        {canEdit && (
          <Button type="button" onClick={() => void handleSave()} disabled={isSaving}>
            Save &amp; Update BOQ
          </Button>
        )}
      </DialogFooter>
    </>
  );
}

export function RateAnalysisDialog({
  open,
  projectId,
  boqItemId,
  currency,
  canEdit,
  onClose,
  onSaved,
}: RateAnalysisDialogProps): React.JSX.Element {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        className="flex max-h-[92vh] min-h-[520px] w-[min(96vw,1200px)] max-w-none flex-col gap-0 overflow-hidden p-0 resize"
        style={{ resize: 'both', overflow: 'auto', minWidth: 720, minHeight: 480 }}
      >
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle>Rate Analysis — Resource Build-Up</DialogTitle>
        </DialogHeader>

        {open && boqItemId ? (
          <RateAnalysisBody
            key={boqItemId}
            projectId={projectId}
            boqItemId={boqItemId}
            currency={currency}
            canEdit={canEdit}
            onClose={onClose}
            onSaved={onSaved}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
