'use client';

import { formatCurrency } from '@/lib/format-currency';
import { buildEstimateSummaryLines } from '@/lib/estimate/summary-lines';
import {
  ReportBrandingFooter,
  ReportBrandingHeader,
} from '@/features/shared/components/ReportBrandingBlock';
import type { EstimateSummaryData } from '@/types/estimate';
import type { ReportBranding } from '@/types/company-settings';

interface EstimatePrintViewProps {
  data: EstimateSummaryData;
  branding: ReportBranding;
}

export function EstimatePrintView({
  data,
  branding,
}: EstimatePrintViewProps): React.JSX.Element {
  const lines = buildEstimateSummaryLines(
    data.breakdown,
    data.resource_totals,
    data.percentages
  );

  return (
    <div className="space-y-8 bg-white p-8 text-black print:p-0">
      <ReportBrandingHeader branding={branding} subtitle="Estimate Report">
        <h1 className="mt-1 text-2xl font-bold">{data.bid_summary.project_name}</h1>
        <p className="text-sm text-gray-600">
          {data.bid_summary.client_name} · {data.bid_summary.location}
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Prepared by {data.bid_summary.prepared_by} ·{' '}
          {data.bid_summary.estimate_date}
        </p>
      </ReportBrandingHeader>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Cost Summary</h2>
        <table className="w-full text-sm">
          <tbody>
            {lines.map((line) => (
              <tr
                key={line.key}
                className={line.highlight ? 'border-t font-bold' : 'border-b'}
              >
                <td className="py-2 pr-4">{line.label}</td>
                <td className="py-2 text-right tabular-nums">
                  {formatCurrency(line.amount, data.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Category Breakdown</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-1 pr-4">Code</th>
              <th className="py-1 pr-4">Discipline</th>
              <th className="py-1 text-right">Amount</th>
              <th className="py-1 text-right">%</th>
            </tr>
          </thead>
          <tbody>
            {data.discipline_breakdown.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="py-2 font-mono">{item.code}</td>
                <td className="py-2">{item.name}</td>
                <td className="py-2 text-right tabular-nums">
                  {formatCurrency(item.amount, data.currency)}
                </td>
                <td className="py-2 text-right">{item.percent.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <ReportBrandingFooter branding={branding} />
    </div>
  );
}
