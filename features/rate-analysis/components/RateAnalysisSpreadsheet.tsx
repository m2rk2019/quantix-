'use client';

import { useCallback, useRef } from 'react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { computeLineAmount } from '@/lib/rate-analysis/compute';
import { formatBoqNumber, parseNumericField } from '@/lib/boq/calculations';
import { formatCurrency } from '@/lib/format-currency';
import type { RateLibraryCategory } from '@/types/rate-library';
import type { CurrencyCode } from '@/types/project';

export interface SpreadsheetLine {
  tempId: string;
  id?: string;
  library_item_id?: string | null;
  project_library_item_id?: string | null;
  category: RateLibraryCategory;
  resource_name: string;
  unit: string;
  consumption: number;
  unit_cost: number;
  waste_percent: number;
  productivity: number | null;
  amount: number;
  sort_order?: number;
  is_stale?: boolean;
}

type EditableColumn =
  | 'resource_name'
  | 'unit'
  | 'consumption'
  | 'unit_cost'
  | 'waste_percent'
  | 'productivity';

const COLUMNS: Array<{ id: EditableColumn | 'amount'; label: string; width: string }> = [
  { id: 'resource_name', label: 'Resource', width: 'min-w-[180px]' },
  { id: 'unit', label: 'Unit', width: 'w-20' },
  { id: 'consumption', label: 'Qty', width: 'w-24' },
  { id: 'unit_cost', label: 'Unit Rate', width: 'w-28' },
  { id: 'waste_percent', label: 'Waste %', width: 'w-20' },
  { id: 'productivity', label: 'Productivity', width: 'w-24' },
  { id: 'amount', label: 'Amount', width: 'w-28' },
];

interface RateAnalysisSpreadsheetProps {
  lines: SpreadsheetLine[];
  currency: CurrencyCode;
  canEdit: boolean;
  onChange: (lines: SpreadsheetLine[]) => void;
}

function updateLine(
  lines: SpreadsheetLine[],
  tempId: string,
  patch: Partial<SpreadsheetLine>
): SpreadsheetLine[] {
  return lines.map((line) => {
    if (line.tempId !== tempId) {
      return line;
    }
    const next = { ...line, ...patch };
    next.amount = computeLineAmount(
      next.consumption,
      next.unit_cost,
      next.waste_percent,
      next.productivity
    );
    return next;
  });
}

export function RateAnalysisSpreadsheet({
  lines,
  currency,
  canEdit,
  onChange,
}: RateAnalysisSpreadsheetProps): React.JSX.Element {
  const tableRef = useRef<HTMLTableElement>(null);

  const handlePaste = useCallback(
    (event: React.ClipboardEvent) => {
      if (!canEdit) {
        return;
      }

      const text = event.clipboardData.getData('text/plain');
      if (!text.includes('\t') && !text.includes('\n')) {
        return;
      }

      event.preventDefault();
      const rows = text
        .replace(/\r\n/g, '\n')
        .split('\n')
        .filter((row) => row.trim().length > 0)
        .map((row) => row.split('\t'));

      const pasted: SpreadsheetLine[] = rows.map((cells) => ({
        tempId: crypto.randomUUID(),
        category: 'material',
        resource_name: cells[0]?.trim() ?? '',
        unit: cells[1]?.trim() || 'item',
        consumption: parseNumericField(cells[2] ?? '0'),
        unit_cost: parseNumericField((cells[3] ?? '0').replace(/[^0-9.\-]/g, '')),
        waste_percent: parseNumericField(cells[4] ?? '0'),
        productivity: cells[5]?.trim() ? parseNumericField(cells[5]) : null,
        amount: 0,
        library_item_id: null,
        project_library_item_id: null,
      }));

      const withAmounts = pasted.map((line) => ({
        ...line,
        amount: computeLineAmount(
          line.consumption,
          line.unit_cost,
          line.waste_percent,
          line.productivity
        ),
      }));

      onChange([...lines, ...withAmounts]);
    },
    [canEdit, lines, onChange]
  );

  const handleCellChange = (
    tempId: string,
    field: EditableColumn,
    rawValue: string
  ) => {
    const patch: Partial<SpreadsheetLine> = {};
    if (field === 'resource_name' || field === 'unit') {
      patch[field] = rawValue;
    } else if (field === 'productivity') {
      patch.productivity = rawValue.trim() === '' ? null : parseNumericField(rawValue);
    } else {
      patch[field] = parseNumericField(rawValue);
    }
    onChange(updateLine(lines, tempId, patch));
  };

  return (
    <div
      className="overflow-auto rounded-lg border bg-background"
      onPaste={handlePaste}
    >
      <table ref={tableRef} className="min-w-full text-sm">
        <thead className="sticky top-0 z-10 bg-muted/80 text-xs uppercase text-muted-foreground backdrop-blur">
          <tr>
            {COLUMNS.map((column) => (
              <th key={column.id} className={`px-2 py-2 text-left ${column.width}`}>
                {column.label}
              </th>
            ))}
            {canEdit && <th className="w-10 px-2 py-2" />}
          </tr>
        </thead>
        <tbody>
          {lines.length === 0 ? (
            <tr>
              <td
                colSpan={canEdit ? COLUMNS.length + 1 : COLUMNS.length}
                className="px-3 py-8 text-center text-muted-foreground"
              >
                Add resources from the library or paste rows from Excel (Tab-separated).
              </td>
            </tr>
          ) : (
            lines.map((line) => (
              <tr
                key={line.tempId}
                className={`border-t ${line.is_stale ? 'bg-amber-500/10' : ''}`}
              >
                <td className="px-1 py-0.5">
                  {canEdit ? (
                    <Input
                      value={line.resource_name}
                      onChange={(e) =>
                        handleCellChange(line.tempId, 'resource_name', e.target.value)
                      }
                      className="h-8 border-transparent bg-transparent focus-visible:bg-background"
                    />
                  ) : (
                    <span className="px-2">{line.resource_name}</span>
                  )}
                </td>
                <td className="px-1 py-0.5">
                  {canEdit ? (
                    <Input
                      value={line.unit}
                      onChange={(e) => handleCellChange(line.tempId, 'unit', e.target.value)}
                      className="h-8 border-transparent bg-transparent focus-visible:bg-background"
                    />
                  ) : (
                    line.unit
                  )}
                </td>
                <td className="px-1 py-0.5">
                  {canEdit ? (
                    <Input
                      value={formatBoqNumber(line.consumption)}
                      onChange={(e) =>
                        handleCellChange(line.tempId, 'consumption', e.target.value)
                      }
                      className="h-8 border-transparent bg-transparent text-right focus-visible:bg-background"
                    />
                  ) : (
                    <span className="block text-right tabular-nums">
                      {formatBoqNumber(line.consumption)}
                    </span>
                  )}
                </td>
                <td className="px-1 py-0.5">
                  {canEdit ? (
                    <Input
                      value={formatBoqNumber(line.unit_cost)}
                      onChange={(e) =>
                        handleCellChange(line.tempId, 'unit_cost', e.target.value)
                      }
                      className={`h-8 border-transparent bg-transparent text-right focus-visible:bg-background ${
                        line.is_stale ? 'text-amber-700' : ''
                      }`}
                    />
                  ) : (
                    <span className="block text-right tabular-nums">
                      {formatCurrency(line.unit_cost, currency)}
                    </span>
                  )}
                </td>
                <td className="px-1 py-0.5">
                  {canEdit ? (
                    <Input
                      value={formatBoqNumber(line.waste_percent)}
                      onChange={(e) =>
                        handleCellChange(line.tempId, 'waste_percent', e.target.value)
                      }
                      className="h-8 border-transparent bg-transparent text-right focus-visible:bg-background"
                    />
                  ) : (
                    <span className="block text-right tabular-nums">
                      {formatBoqNumber(line.waste_percent)}
                    </span>
                  )}
                </td>
                <td className="px-1 py-0.5">
                  {canEdit ? (
                    <Input
                      value={
                        line.productivity === null ? '' : formatBoqNumber(line.productivity)
                      }
                      onChange={(e) =>
                        handleCellChange(line.tempId, 'productivity', e.target.value)
                      }
                      placeholder="—"
                      className="h-8 border-transparent bg-transparent text-right focus-visible:bg-background"
                    />
                  ) : (
                    <span className="block text-right tabular-nums">
                      {line.productivity ?? '—'}
                    </span>
                  )}
                </td>
                <td className="px-2 py-1 text-right font-medium tabular-nums">
                  {formatCurrency(line.amount, currency)}
                </td>
                {canEdit && (
                  <td className="px-1 py-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() =>
                        onChange(lines.filter((item) => item.tempId !== line.tempId))
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
