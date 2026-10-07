'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, FileText, Printer, RefreshCw } from 'lucide-react';

import { ConnectivityBanner } from '@/components/connectivity/ConnectivityBanner';
import { Button } from '@/components/ui/button';
import { PanelSkeleton } from '@/components/ui/skeleton';
import { BidSummaryPanel } from '@/features/estimate/components/BidSummaryPanel';
import { CostSummaryPanel } from '@/features/estimate/components/CostSummaryPanel';
import { DisciplineBreakdownPanel } from '@/features/estimate/components/DisciplineBreakdownPanel';
import { EstimateChartsPanel } from '@/features/estimate/components/EstimateChartsPanel';
import { EstimateDashboardCards } from '@/features/estimate/components/EstimateDashboardCards';
import { WbsRollupPanel } from '@/features/estimate/components/WbsRollupPanel';
import { ValidationPanel } from '@/features/validation/components/ValidationPanel';
import { useBackgroundRefresh } from '@/hooks/useBackgroundRefresh';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { ROUTES } from '@/lib/constants/routes';
import { buildEstimateSummaryLines } from '@/lib/estimate/summary-lines';
import {
  refreshEstimateSummaryAction,
  updateEstimateMarkupsAction,
} from '@/services/estimate/estimate-actions';
import { loadEstimateValidationAction } from '@/services/validation/validation-actions';
import type { ReportBranding } from '@/types/company-settings';
import type {
  EstimatePercentages,
  EstimateSummaryData,
} from '@/types/estimate';
import type { ProjectStatus } from '@/types/project';
import { PROJECT_STATUS_LABELS } from '@/types/project';
import type { EstimateValidationResult } from '@/types/validation';

interface EstimateSummaryModuleProps {
  projectId: string;
  projectStatus: ProjectStatus;
  canEditMarkups: boolean;
  initialData: EstimateSummaryData;
  initialValidation: EstimateValidationResult;
  branding: ReportBranding;
}

export function EstimateSummaryModule({
  projectId,
  projectStatus,
  canEditMarkups,
  initialData,
  initialValidation,
  branding,
}: EstimateSummaryModuleProps): React.JSX.Element {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [validation, setValidation] = useState(initialValidation);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const { isOnline } = useNetworkStatus();

  const lines = useMemo(
    () =>
      buildEstimateSummaryLines(
        data.breakdown,
        data.resource_totals,
        data.percentages
      ),
    [data]
  );

  const isReadOnly =
    projectStatus === 'archived' || projectStatus === 'approved';
  const allowMarkupEdit = canEditMarkups && !isReadOnly;

  const refresh = useCallback(async () => {
    if (!isOnline) {
      setRefreshError('You are offline. Reconnect to refresh the estimate summary.');
      return;
    }

    setIsRefreshing(true);
    setRefreshError(null);

    try {
      const [next, nextValidation] = await Promise.all([
        refreshEstimateSummaryAction(projectId),
        loadEstimateValidationAction(projectId),
      ]);
      if (next) {
        setData(next);
      }
      setValidation(nextValidation);
      router.refresh();
    } catch (error) {
      setRefreshError(
        error instanceof Error
          ? error.message
          : 'Failed to refresh estimate summary.'
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [isOnline, projectId, router]);

  useBackgroundRefresh({
    onRefresh: refresh,
    intervalMs: 15_000,
  });

  useEffect(() => {
    function handleFocus(): void {
      void refresh();
    }

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refresh]);

  const handleMarkupSave = useCallback(
    async (field: keyof EstimatePercentages, value: number) => {
      const result = await updateEstimateMarkupsAction(projectId, {
        [field]: value,
      });

      if (result.success) {
        await refresh();
      }

      return result;
    },
    [projectId, refresh]
  );

  const handleExport = useCallback(async () => {
    if (!validation.canExport || !isOnline) {
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/export`);

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? 'Export failed.');
      }

      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition');
      const filenameMatch = disposition?.match(/filename="([^"]+)"/);
      const filename = filenameMatch?.[1] ?? 'estimate.xlsx';
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : 'Failed to export estimate.'
      );
    } finally {
      setIsExporting(false);
    }
  }, [isOnline, projectId, validation.canExport]);

  const printUrl = ROUTES.projectSummaryPrint(projectId);

  return (
    <div className="space-y-6">
      <ConnectivityBanner onRetry={() => void refresh()} />

      {refreshError ? (
        <div
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm"
          role="alert"
        >
          {refreshError}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm text-muted-foreground">
          Status: {PROJECT_STATUS_LABELS[projectStatus]}
          {isReadOnly && ' · Read-only'}
          {allowMarkupEdit && ' · Click Edit on markup lines to adjust percentages'}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void refresh()}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={isRefreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'}
            />
            Refresh
          </Button>
          {validation.hasExportPermission ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={!validation.canExport || isExporting || !isOnline}
                title={
                  !isOnline
                    ? 'Reconnect to export.'
                    : validation.exportBlockedReason
                }
                onClick={() => void handleExport()}
              >
                <Download
                  className={isExporting ? 'h-4 w-4 animate-pulse' : 'h-4 w-4'}
                />
                {isExporting ? 'Exporting…' : 'Excel'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <a href={printUrl} target="_blank" rel="noopener noreferrer">
                  <Printer className="h-4 w-4" />
                  Print
                </a>
              </Button>
              <Button type="button" variant="outline" asChild>
                <a
                  href={`${printUrl}?autoprint=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileText className="h-4 w-4" />
                  PDF
                </a>
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {exportError ? (
        <div
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm"
          role="alert"
        >
          {exportError}
        </div>
      ) : null}

      <ValidationPanel validation={validation} />

      {isRefreshing ? (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <PanelSkeleton key={index} />
            ))}
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <PanelSkeleton />
            <PanelSkeleton />
          </div>
        </div>
      ) : (
        <>
          <EstimateDashboardCards data={data} />

          <div className="grid gap-6 xl:grid-cols-2">
            <CostSummaryPanel
              currency={data.currency}
              lines={lines}
              boqItemCount={data.boq_item_count}
              updatedAt={data.updated_at}
              canEditMarkups={allowMarkupEdit}
              onMarkupSave={handleMarkupSave}
            />
            <BidSummaryPanel
              bid={data.bid_summary}
              currency={data.currency}
              branding={branding}
            />
          </div>

          <DisciplineBreakdownPanel
            items={data.discipline_breakdown}
            currency={data.currency}
          />

          <WbsRollupPanel nodes={data.wbs_rollup} currency={data.currency} />

          <EstimateChartsPanel data={data} />
        </>
      )}
    </div>
  );
}
