import { CircleDollarSign, FileSpreadsheet, Network } from 'lucide-react';

import { KpiCard } from '@/components/ui/kpi-card';
import { formatCurrency } from '@/lib/format-currency';
import type { CurrencyCode } from '@/types/project';

interface ProjectSummaryCardsProps {
  wbsNodeCount: number;
  boqItemCount: number;
  grandTotal: number;
  currency: CurrencyCode;
}

export function ProjectSummaryCards({
  wbsNodeCount,
  boqItemCount,
  grandTotal,
  currency,
}: ProjectSummaryCardsProps): React.JSX.Element {
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-3">
      <KpiCard label="WBS Nodes" value={String(wbsNodeCount)} icon={Network} />
      <KpiCard label="BOQ Items" value={String(boqItemCount)} icon={FileSpreadsheet} />
      <KpiCard
        label="Grand Total"
        value={formatCurrency(grandTotal, currency)}
        icon={CircleDollarSign}
        primary
      />
    </div>
  );
}
