'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/format-currency';
import type { FormulaAuditResult } from '@/types/benchmark';

interface FormulaAuditPanelProps {
  audit: FormulaAuditResult;
  currency?: string;
}

export function FormulaAuditPanel({
  audit,
}: FormulaAuditPanelProps): React.JSX.Element {
  const [selectedCode, setSelectedCode] = useState<string | null>(
    audit.lines[0]?.item_code ?? null
  );

  const selected = audit.lines.find((line) => line.item_code === selectedCode);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="overflow-x-auto rounded-lg border max-h-[480px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted/95">
            <tr className="border-b text-left">
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {audit.lines.map((line) => (
              <tr
                key={line.item_code}
                className={`cursor-pointer border-b hover:bg-muted/50 ${selectedCode === line.item_code ? 'bg-primary/5' : ''}`}
                onClick={() => setSelectedCode(line.item_code)}
              >
                <td className="px-3 py-2 font-mono">{line.item_code}</td>
                <td className="px-3 py-2">
                  <Badge variant={line.passed ? 'secondary' : 'destructive'}>
                    {line.passed ? 'Pass' : 'Fail'}
                  </Badge>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatCurrency(line.total_amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected ? (
        <div className="space-y-4 rounded-lg border p-4">
          <div>
            <h3 className="font-semibold">{selected.item_code}</h3>
            <p className="text-sm text-muted-foreground">{selected.description}</p>
          </div>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Quantity Formula</dt>
              <dd className="font-mono">{selected.quantity_formula}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Rate Formula</dt>
              <dd className="font-mono">{selected.rate_formula}</dd>
            </div>
          </dl>
          <div>
            <h4 className="mb-2 text-sm font-medium">Resource Breakdown</h4>
            <ul className="space-y-1 text-sm">
              {selected.resource_breakdown.map((row) => (
                <li key={row.category} className="flex justify-between">
                  <span>{row.category}</span>
                  <span className="tabular-nums">{formatCurrency(row.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-medium">Markup Breakdown (line share)</h4>
            <ul className="space-y-1 text-sm">
              <li className="flex justify-between"><span>Direct</span><span>{formatCurrency(selected.markup_breakdown.direct_cost)}</span></li>
              <li className="flex justify-between"><span>OCM ({selected.percentages.indirect_cost_percent}%)</span><span>{formatCurrency(selected.markup_breakdown.indirect_cost)}</span></li>
              <li className="flex justify-between"><span>Contingency ({selected.percentages.contingency_percent}%)</span><span>{formatCurrency(selected.markup_breakdown.contingency)}</span></li>
              <li className="flex justify-between"><span>Profit ({selected.percentages.markup_percent}%)</span><span>{formatCurrency(selected.markup_breakdown.markup)}</span></li>
              <li className="flex justify-between"><span>VAT ({selected.percentages.vat_percent}%)</span><span>{formatCurrency(selected.markup_breakdown.vat)}</span></li>
              <li className="flex justify-between font-semibold"><span>Grand Total</span><span>{formatCurrency(selected.markup_breakdown.grand_total)}</span></li>
            </ul>
          </div>
          {selected.issues.length > 0 && (
            <ul className="text-sm text-destructive">
              {selected.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Select a BOQ line to drill down.</p>
      )}

      <p className="lg:col-span-2 text-sm text-muted-foreground">
        Formula accuracy: {audit.accuracy_percent.toFixed(1)}% ({audit.passed_count}/{audit.lines.length} passed)
      </p>
    </div>
  );
}
