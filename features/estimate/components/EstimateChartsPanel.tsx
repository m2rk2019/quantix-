'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatCurrency } from '@/lib/format-currency';
import {
  SimpleBarChart,
  SimpleDonutChart,
} from '@/features/estimate/components/charts/EstimateCharts';
import type { EstimateSummaryData } from '@/types/estimate';

const RESOURCE_COLORS = {
  material: '#1f4e79',
  labor: '#2e75b6',
  equipment: '#5b9bd5',
  subcontract: '#9dc3e6',
};

interface EstimateChartsPanelProps {
  data: EstimateSummaryData;
}

export function EstimateChartsPanel({
  data,
}: EstimateChartsPanelProps): React.JSX.Element {
  const { currency, breakdown, resource_totals, discipline_breakdown, top_boq_items, monthly_cash_placeholder } = data;

  const resourceSlices = [
    { label: 'Material', value: resource_totals.material, color: RESOURCE_COLORS.material },
    { label: 'Labor', value: resource_totals.labor, color: RESOURCE_COLORS.labor },
    { label: 'Equipment', value: resource_totals.equipment, color: RESOURCE_COLORS.equipment },
    { label: 'Subcontract', value: resource_totals.subcontract, color: RESOURCE_COLORS.subcontract },
  ];

  const bidSlices = [
    { label: 'Direct', value: breakdown.direct_cost, color: '#1f4e79' },
    { label: 'OCM', value: breakdown.indirect_cost, color: '#2e75b6' },
    { label: 'Contingency', value: breakdown.contingency, color: '#5b9bd5' },
    { label: 'Profit', value: breakdown.markup, color: '#70ad47' },
    { label: 'VAT', value: breakdown.vat, color: '#ffc000' },
  ];

  const disciplineBars = discipline_breakdown.slice(0, 8).map((item, index) => ({
    label: item.name,
    value: item.amount,
    color: `hsl(${210 + index * 18}, 55%, ${42 + index * 3}%)`,
  }));

  const topItemBars = top_boq_items.map((item, index) => ({
    label: `${item.item_code} — ${item.description.slice(0, 28)}`,
    value: item.amount,
    color: `hsl(${220 - index * 8}, 60%, 45%)`,
  }));

  const cashBars = monthly_cash_placeholder.map((item) => ({
    label: item.month,
    value: item.amount,
    color: '#94a3b8',
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cost Breakdown</CardTitle>
          <CardDescription>Direct cost through VAT to bid price</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <SimpleDonutChart slices={bidSlices} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Material vs Labor vs Equipment</CardTitle>
          <CardDescription>Resource-type distribution</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <SimpleDonutChart slices={resourceSlices} />
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 xl:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">Category Cost Distribution</CardTitle>
          <CardDescription>Top WBS discipline groups</CardDescription>
        </CardHeader>
        <CardContent>
          <SimpleBarChart items={disciplineBars} />
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Top 10 Highest Cost Items</CardTitle>
          <CardDescription>BOQ lines ranked by total amount</CardDescription>
        </CardHeader>
        <CardContent>
          {topItemBars.length === 0 ? (
            <p className="text-sm text-muted-foreground">No BOQ items yet.</p>
          ) : (
            <SimpleBarChart items={topItemBars} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly Cash Distribution</CardTitle>
          <CardDescription>Placeholder — equal monthly spread</CardDescription>
        </CardHeader>
        <CardContent>
          <SimpleBarChart items={cashBars} height={180} />
          <p className="mt-2 text-xs text-muted-foreground">
            Total: {formatCurrency(breakdown.grand_total, currency)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
