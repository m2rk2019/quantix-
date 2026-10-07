'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatCurrency } from '@/lib/format-currency';
import type { DisciplineBreakdownItem } from '@/types/estimate';
import type { CurrencyCode } from '@/types/project';

interface DisciplineBreakdownPanelProps {
  items: DisciplineBreakdownItem[];
  currency: CurrencyCode;
}

export function DisciplineBreakdownPanel({
  items,
  currency,
}: DisciplineBreakdownPanelProps): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Breakdown</CardTitle>
        <CardDescription>
          Cost contribution by WBS discipline / trade section
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-[88px_1fr_120px_72px] gap-2 border-b bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
          <span>Code</span>
          <span>Category</span>
          <span className="text-right">Amount</span>
          <span className="text-right">%</span>
        </div>
        {items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            No WBS categories to display.
          </p>
        ) : (
          <div className="max-h-80 overflow-auto">
            {items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[88px_1fr_120px_72px] items-center gap-2 border-b px-4 py-2.5 text-sm last:border-b-0"
              >
                <span className="font-mono text-xs text-muted-foreground">{item.code}</span>
                <span className="truncate font-medium">{item.name}</span>
                <span className="text-right tabular-nums">
                  {formatCurrency(item.amount, currency)}
                </span>
                <span className="text-right tabular-nums text-muted-foreground">
                  {item.percent.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
