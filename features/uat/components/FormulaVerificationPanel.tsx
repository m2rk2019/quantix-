'use client';

import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/format-currency';
import type { UatFormulaVerificationResult } from '@/types/uat';

interface FormulaVerificationPanelProps {
  data: UatFormulaVerificationResult;
}

export function FormulaVerificationPanel({
  data,
}: FormulaVerificationPanelProps): React.JSX.Element {
  const failedRows = data.rows.filter((row) => !row.passed);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Project</p>
          <p className="font-medium">{data.project_code}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Accuracy</p>
          <p className="text-xl font-semibold tabular-nums">
            {data.accuracy_percent.toFixed(1)}%
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Passed</p>
          <p className="text-xl font-semibold text-green-700 tabular-nums">
            {data.passed_count}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Failed</p>
          <p className="text-xl font-semibold text-destructive tabular-nums">
            {data.failed_count}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/95">
            <tr className="border-b text-left">
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2 text-right">Manual Rate</th>
              <th className="px-3 py-2 text-right">System Rate</th>
              <th className="px-3 py-2 text-right">Rate Var %</th>
              <th className="px-3 py-2 text-right">Manual Amount</th>
              <th className="px-3 py-2 text-right">System Amount</th>
              <th className="px-3 py-2 text-right">Amt Var %</th>
              <th className="px-3 py-2">Result</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.item_code} className="border-b">
                <td className="px-3 py-2 font-mono">{row.item_code}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatCurrency(row.manual_total_rate)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatCurrency(row.system_total_rate)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{row.rate_variance}%</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatCurrency(row.manual_total_amount)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatCurrency(row.system_total_amount)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{row.amount_variance}%</td>
                <td className="px-3 py-2">
                  <Badge variant={row.passed ? 'secondary' : 'destructive'}>
                    {row.passed ? 'Pass' : 'Fail'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {failedRows.length > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <h4 className="mb-2 text-sm font-medium text-destructive">Failed Items</h4>
          <ul className="space-y-1 text-sm">
            {failedRows.map((row) => (
              <li key={row.item_code}>
                {row.item_code}: rate variance {row.rate_variance}%, amount variance{' '}
                {row.amount_variance}%
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Manual calculations use Mat + Lab + Eq + Sub + Oth for rate and Qty × Rate for amount.
        Tolerance ±0.01. Overall: {data.failed_count === 0 ? 'PASS' : 'FAIL'}.
      </p>
    </div>
  );
}
