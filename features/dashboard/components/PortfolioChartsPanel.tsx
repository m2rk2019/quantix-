'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  SimpleBarChart,
  SimpleDonutChart,
} from '@/features/estimate/components/charts/EstimateCharts';
import { formatCurrency } from '@/lib/format-currency';
import type { ExecutiveDashboardData } from '@/types/dashboard';

const DASHBOARD_CARD =
  'rounded-2xl border border-border/60 bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04),0_6px_20px_rgb(0_0_0/0.05)]';

const RESOURCE_COLORS = {
  material: '#E31E24',
  labor: '#ef4444',
  equipment: '#f87171',
  subcontract: '#fca5a5',
};

interface PortfolioChartsPanelProps {
  data: ExecutiveDashboardData;
}

export function PortfolioChartsPanel({
  data,
}: PortfolioChartsPanelProps): React.JSX.Element {
  const { cost_breakdown, discipline_breakdown, wbs_distribution, top_cost_items, resource_usage, display_currency } = data;

  const costSlices = [
    { label: 'Material', value: cost_breakdown.material, color: RESOURCE_COLORS.material },
    { label: 'Labor', value: cost_breakdown.labor, color: RESOURCE_COLORS.labor },
    { label: 'Equipment', value: cost_breakdown.equipment, color: RESOURCE_COLORS.equipment },
    { label: 'Subcontract', value: cost_breakdown.subcontract, color: RESOURCE_COLORS.subcontract },
    { label: 'OCM', value: cost_breakdown.ocm, color: '#70ad47' },
    { label: 'Contingency', value: cost_breakdown.contingency, color: '#ffc000' },
    { label: 'Profit', value: cost_breakdown.profit, color: '#c55a11' },
    { label: 'VAT', value: cost_breakdown.vat, color: '#7030a0' },
  ].filter((slice) => slice.value > 0);

  const bidSlices = [
    { label: 'Direct (resources)', value: resource_usage.material + resource_usage.labor + resource_usage.equipment + resource_usage.subcontract, color: '#d71920' },
    { label: 'OCM', value: cost_breakdown.ocm, color: '#e84b50' },
    { label: 'Contingency', value: cost_breakdown.contingency, color: '#f17b7f' },
    { label: 'Profit', value: cost_breakdown.profit, color: '#a51218' },
    { label: 'VAT', value: cost_breakdown.vat, color: '#6b7280' },
  ].filter((slice) => slice.value > 0);

  const disciplineBars = discipline_breakdown.slice(0, 8).map((item, index) => ({
    label: item.name.slice(0, 32),
    value: item.amount,
    color: `hsl(${355 - index * 12}, 70%, ${45 + index * 3}%)`,
  }));

  const wbsBars = wbs_distribution.slice(0, 10).map((item, index) => ({
    label: `${item.code}`.slice(0, 28),
    value: item.amount,
    color: `hsl(${200 + index * 12}, 50%, 45%)`,
  }));

  const topItemBars = top_cost_items.map((item, index) => ({
    label: `${item.item_code} — ${item.description.slice(0, 24)}`,
    value: item.amount,
    color: `hsl(${220 - index * 6}, 60%, 45%)`,
  }));

  const resourceSlices = [
    { label: 'Material', value: resource_usage.material, color: RESOURCE_COLORS.material },
    { label: 'Labor', value: resource_usage.labor, color: RESOURCE_COLORS.labor },
    { label: 'Equipment', value: resource_usage.equipment, color: RESOURCE_COLORS.equipment },
    { label: 'Subcontract', value: resource_usage.subcontract, color: RESOURCE_COLORS.subcontract },
  ].filter((slice) => slice.value > 0);

  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      <Card className={DASHBOARD_CARD}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Cost Breakdown</CardTitle>
          <CardDescription>Material through VAT across portfolio</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          {costSlices.length > 0 ? (
            <SimpleDonutChart slices={costSlices} />
          ) : (
            <p className="text-sm text-muted-foreground">No cost data yet.</p>
          )}
        </CardContent>
      </Card>

      <Card className={DASHBOARD_CARD}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Bid Composition</CardTitle>
          <CardDescription>Direct cost, OCM, contingency, profit, VAT</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          {bidSlices.length > 0 ? (
            <SimpleDonutChart slices={bidSlices} />
          ) : (
            <p className="text-sm text-muted-foreground">No bid data yet.</p>
          )}
        </CardContent>
      </Card>

      <Card className={DASHBOARD_CARD}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Resource Usage</CardTitle>
          <CardDescription>Material, labor, equipment, subcontract</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          {resourceSlices.length > 0 ? (
            <SimpleDonutChart slices={resourceSlices} />
          ) : (
            <p className="text-sm text-muted-foreground">No resource data yet.</p>
          )}
        </CardContent>
      </Card>

      <Card className={`lg:col-span-2 ${DASHBOARD_CARD}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Cost by Discipline</CardTitle>
          <CardDescription>Top WBS discipline groups</CardDescription>
        </CardHeader>
        <CardContent>
          {disciplineBars.length > 0 ? (
            <SimpleBarChart items={disciplineBars} />
          ) : (
            <p className="text-sm text-muted-foreground">No discipline data yet.</p>
          )}
        </CardContent>
      </Card>

      <Card className={DASHBOARD_CARD}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">WBS Cost Distribution</CardTitle>
          <CardDescription>Root-level WBS segments</CardDescription>
        </CardHeader>
        <CardContent>
          {wbsBars.length > 0 ? (
            <SimpleBarChart items={wbsBars} height={200} />
          ) : (
            <p className="text-sm text-muted-foreground">No WBS data yet.</p>
          )}
        </CardContent>
      </Card>

      <Card className={`lg:col-span-2 xl:col-span-3 ${DASHBOARD_CARD}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Top 20 Cost Items</CardTitle>
          <CardDescription>Highest-value BOQ lines across portfolio</CardDescription>
        </CardHeader>
        <CardContent>
          {topItemBars.length > 0 ? (
            <SimpleBarChart items={topItemBars} />
          ) : (
            <p className="text-sm text-muted-foreground">No BOQ items yet.</p>
          )}
          {top_cost_items.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Portfolio total: {formatCurrency(cost_breakdown.grand_total, display_currency)}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
