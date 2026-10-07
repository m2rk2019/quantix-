'use client';

import { CircleDollarSign, Layers, Shield, Wallet } from 'lucide-react';

import { KpiCard } from '@/components/ui/kpi-card';
import { formatCurrency } from '@/lib/format-currency';
import type { EstimateSummaryData } from '@/types/estimate';

interface EstimateDashboardCardsProps {
  data: EstimateSummaryData;
}

export function EstimateDashboardCards({
  data,
}: EstimateDashboardCardsProps): React.JSX.Element {
  const cards = [
    {
      label: 'Direct Cost',
      value: formatCurrency(data.breakdown.direct_cost, data.currency),
      icon: Wallet,
      primary: false,
    },
    {
      label: 'OCM',
      value: formatCurrency(data.breakdown.indirect_cost, data.currency),
      icon: Layers,
      primary: false,
    },
    {
      label: 'Contingency',
      value: formatCurrency(data.breakdown.contingency, data.currency),
      icon: Shield,
      primary: false,
    },
    {
      label: 'Total Bid',
      value: formatCurrency(data.breakdown.grand_total, data.currency),
      icon: CircleDollarSign,
      primary: true,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <KpiCard
          key={card.label}
          label={card.label}
          value={card.value}
          icon={card.icon}
          primary={card.primary}
        />
      ))}
    </div>
  );
}
