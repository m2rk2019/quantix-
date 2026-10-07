'use client';

import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/format-currency';
import type { RateBuildUpMarkups, RateBuildUpSummary } from '@/types/rate-library';
import type { RateLibraryCategory } from '@/types/rate-library';
import type { CurrencyCode } from '@/types/project';

interface RateAnalysisCostSummaryProps {
  currency: CurrencyCode;
  categoryTotals: Record<RateLibraryCategory, number>;
  otherCostRate: number;
  buildUp: RateBuildUpSummary;
  markups: RateBuildUpMarkups;
  canEdit: boolean;
  onMarkupChange: (field: keyof RateBuildUpMarkups, value: number) => void;
}

export function RateAnalysisCostSummary({
  currency,
  categoryTotals,
  otherCostRate,
  buildUp,
  markups,
  canEdit,
  onMarkupChange,
}: RateAnalysisCostSummaryProps): React.JSX.Element {
  const rows: Array<{ label: string; value: number; editable?: keyof RateBuildUpMarkups }> = [
    { label: 'Material Cost', value: categoryTotals.material },
    { label: 'Labor Cost', value: categoryTotals.labor },
    { label: 'Equipment Cost', value: categoryTotals.equipment },
    { label: 'Subcontract Cost', value: categoryTotals.subcontract },
    { label: 'Other Cost', value: otherCostRate },
    { label: 'Direct Cost', value: buildUp.direct_cost },
    { label: 'OCM', value: buildUp.ocm, editable: 'ocm_percent' },
    { label: 'Contingency', value: buildUp.contingency, editable: 'contingency_percent' },
    { label: 'Profit', value: buildUp.profit, editable: 'profit_percent' },
    { label: 'VAT', value: buildUp.vat, editable: 'vat_percent' },
  ];

  return (
    <aside className="w-full shrink-0 rounded-lg border bg-muted/20 lg:w-72">
      <div className="border-b px-3 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Cost Summary
        </h3>
      </div>
      <div className="space-y-1 p-3 text-sm">
        {rows.map((row) => (
          <div
            key={row.label}
            className={`flex items-center justify-between gap-2 ${
              row.label === 'Direct Cost' || row.label === 'Final BOQ Rate'
                ? 'border-t pt-2 font-semibold'
                : ''
            }`}
          >
            <span className="text-muted-foreground">{row.label}</span>
            <div className="flex items-center gap-2">
              {row.editable && canEdit && (
                <Input
                  value={markups[row.editable].toFixed(2)}
                  onChange={(event) =>
                    onMarkupChange(row.editable!, Number(event.target.value) || 0)
                  }
                  className="h-7 w-16 text-right text-xs"
                  aria-label={`${row.label} percent`}
                />
              )}
              <span className="tabular-nums">{formatCurrency(row.value, currency)}</span>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between gap-2 border-t pt-2 text-base font-bold">
          <span>Final BOQ Rate</span>
          <span className="tabular-nums text-primary">
            {formatCurrency(buildUp.final_rate, currency)}
          </span>
        </div>
      </div>
    </aside>
  );
}
