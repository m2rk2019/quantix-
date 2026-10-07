'use client';

import { useState } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/format-currency';
import { AiSuggestionExplainer } from '@/features/ai-estimator/components/AiSuggestionExplainer';
import { AiQuantityExplainer } from '@/features/ai-estimator/components/AiQuantityExplainer';
import type { AiBoqSuggestion } from '@/types/ai-estimator';
import type { CurrencyCode } from '@/types/project';

interface AiBoqReviewPanelProps {
  items: AiBoqSuggestion[];
  currency: CurrencyCode;
  onToggle: (tempId: string, selected: boolean) => void;
  onQuantityChange: (tempId: string, quantity: number) => void;
}

export function AiBoqReviewPanel({
  items,
  currency,
  onToggle,
  onQuantityChange,
}: AiBoqReviewPanelProps): React.JSX.Element {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const selected = items.filter((item) => item.selected);
  const directCost = selected.reduce((sum, item) => sum + item.total_amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>BOQ Review</CardTitle>
        <CardDescription>
          {selected.length} of {items.length} items selected · Direct cost{' '}
          {formatCurrency(directCost, currency)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => {
          const isExpanded = expandedId === item.temp_id;

          return (
            <div key={item.temp_id} className="rounded-lg border p-3">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={item.selected}
                  onChange={(event) =>
                    onToggle(item.temp_id, event.target.checked)
                  }
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs text-muted-foreground">
                        {item.wbs_code}
                      </span>
                      <p className="font-medium">{item.description}</p>
                    </div>
                    <p className="shrink-0 tabular-nums font-medium">
                      {formatCurrency(item.total_amount, currency)}
                    </p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-[120px_1fr_auto] sm:items-center">
                    <span className="text-xs text-muted-foreground">Quantity</span>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.quantity}
                      onChange={(event) =>
                        onQuantityChange(item.temp_id, Number(event.target.value))
                      }
                    />
                    <span className="text-sm text-muted-foreground">{item.unit}</span>
                  </div>

                  <AiQuantityExplainer
                    explanation={item.quantity_explanation}
                    compact
                  />

                  <AiSuggestionExplainer explanation={item.explanation} compact />

                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : item.temp_id)
                    }
                  >
                    {isExpanded ? 'Hide rate analysis' : 'Show rate analysis & explain'}
                  </button>

                  {isExpanded ? (
                    <div className="space-y-2 border-t pt-2">
                      <AiQuantityExplainer explanation={item.quantity_explanation} />
                      <AiSuggestionExplainer explanation={item.explanation} />
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-left text-muted-foreground">
                              <th className="py-1 pr-2">Category</th>
                              <th className="py-1 pr-2">Resource</th>
                              <th className="py-1 pr-2 text-right">Amount</th>
                              <th className="py-1">Source</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.rate_analysis_lines.map((line) => (
                              <tr key={`${item.temp_id}-${line.category}`} className="border-t">
                                <td className="py-1.5 pr-2 capitalize">{line.category}</td>
                                <td className="py-1.5 pr-2">{line.resource_name}</td>
                                <td className="py-1.5 pr-2 text-right tabular-nums">
                                  {formatCurrency(line.amount, currency)}
                                </td>
                                <td className="py-1.5">
                                  {line.is_ai_estimated ? 'AI Estimated' : 'Library'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}
                </div>
              </label>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
