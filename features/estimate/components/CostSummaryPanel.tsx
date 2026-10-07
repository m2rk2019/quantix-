'use client';

import { useCallback, useState } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/format-currency';
import type { EstimateLineItem, EstimatePercentages } from '@/types/estimate';
import type { CurrencyCode } from '@/types/project';

interface CostSummaryPanelProps {
  currency: CurrencyCode;
  lines: EstimateLineItem[];
  boqItemCount: number;
  updatedAt: string;
  canEditMarkups?: boolean;
  onMarkupSave?: (
    field: keyof EstimatePercentages,
    value: number
  ) => Promise<{ success: boolean; error?: string }>;
}

function formatPercent(value: number | null): string {
  if (value === null) {
    return '—';
  }

  return `${value.toFixed(2)}%`;
}

export function CostSummaryPanel({
  currency,
  lines,
  boqItemCount,
  updatedAt,
  canEditMarkups = false,
  onMarkupSave,
}: CostSummaryPanelProps): React.JSX.Element {
  const [editingField, setEditingField] = useState<
    keyof EstimatePercentages | null
  >(null);
  const [draftValue, setDraftValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const startEdit = useCallback(
    (field: keyof EstimatePercentages, current: number | null) => {
      setEditingField(field);
      setDraftValue(current !== null ? String(current) : '0');
      setSaveError(null);
    },
    []
  );

  const cancelEdit = useCallback(() => {
    setEditingField(null);
    setDraftValue('');
    setSaveError(null);
  }, []);

  const commitEdit = useCallback(async () => {
    if (!editingField || !onMarkupSave) {
      return;
    }

    const parsed = Number(draftValue);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
      setSaveError('Enter a percentage between 0 and 100.');
      return;
    }

    setSaving(true);
    setSaveError(null);

    const result = await onMarkupSave(editingField, parsed);
    setSaving(false);

    if (result.success) {
      setEditingField(null);
      setDraftValue('');
    } else {
      setSaveError(result.error ?? 'Failed to save markup.');
    }
  }, [draftValue, editingField, onMarkupSave]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Estimate Summary</CardTitle>
        <CardDescription>
          Consolidated from {boqItemCount.toLocaleString()} BOQ item
          {boqItemCount === 1 ? '' : 's'}. Last updated{' '}
          {new Date(updatedAt).toLocaleString('en-GB', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
          .
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {saveError ? (
          <p className="text-sm text-destructive" role="alert">
            {saveError}
          </p>
        ) : null}

        {lines.map((line) => {
          const isEditing =
            line.percentField && editingField === line.percentField;
          const showEdit =
            canEditMarkups &&
            line.editable &&
            line.percentField &&
            onMarkupSave;

          return (
            <div
              key={line.key}
              className={
                line.highlight
                  ? 'border-t pt-4'
                  : 'flex items-center justify-between gap-4 border-b border-dashed pb-3 last:border-b-0'
              }
            >
              <div className="min-w-0 flex-1">
                <p
                  className={
                    line.highlight
                      ? 'text-lg font-semibold'
                      : 'font-medium'
                  }
                >
                  {line.label}
                </p>
                {line.percent !== null && !isEditing && (
                  <p className="text-sm text-muted-foreground">
                    {formatPercent(line.percent)}
                    {showEdit ? (
                      <button
                        type="button"
                        className="ml-2 text-primary hover:underline"
                        onClick={() =>
                          startEdit(line.percentField!, line.percent)
                        }
                      >
                        Edit
                      </button>
                    ) : null}
                  </p>
                )}
                {isEditing ? (
                  <div className="mt-1 flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      className="h-8 w-24"
                      value={draftValue}
                      disabled={saving}
                      onChange={(event) => setDraftValue(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          void commitEdit();
                        }
                        if (event.key === 'Escape') {
                          cancelEdit();
                        }
                      }}
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      disabled={saving}
                      onClick={() => void commitEdit()}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:underline"
                      disabled={saving}
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>
                  </div>
                ) : null}
              </div>
              <p
                className={
                  line.highlight
                    ? 'text-2xl font-bold tabular-nums text-primary'
                    : 'text-right font-medium tabular-nums'
                }
              >
                {formatCurrency(line.amount, currency)}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
