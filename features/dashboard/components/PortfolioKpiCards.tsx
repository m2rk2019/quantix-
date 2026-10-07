'use client';

import {
  Briefcase,
  CircleDollarSign,
  FileEdit,
  FolderKanban,
  Percent,
  TrendingUp,
} from 'lucide-react';

import { formatCurrency } from '@/lib/format-currency';
import type { ExecutiveDashboardData } from '@/types/dashboard';

import { ExecutiveKpiCard } from './ExecutiveKpiCard';

interface PortfolioKpiCardsProps {
  data: ExecutiveDashboardData;
}

export function PortfolioKpiCards({
  data,
}: PortfolioKpiCardsProps): React.JSX.Element {
  const { kpis, display_currency: currency } = data;

  const cards = [
    {
      label: 'Total Projects',
      value: String(kpis.total_projects),
      numericValue: kpis.total_projects,
      valueFormat: 'number' as const,
      icon: FolderKanban,
      highlight: false,
    },
    {
      label: 'Active Projects',
      value: String(kpis.active_projects),
      numericValue: kpis.active_projects,
      valueFormat: 'number' as const,
      icon: Briefcase,
      highlight: false,
    },
    {
      label: 'Completed',
      value: String(kpis.completed_projects),
      numericValue: kpis.completed_projects,
      valueFormat: 'number' as const,
      icon: TrendingUp,
      highlight: false,
    },
    {
      label: 'Draft',
      value: String(kpis.draft_projects),
      numericValue: kpis.draft_projects,
      valueFormat: 'number' as const,
      icon: FileEdit,
      highlight: false,
    },
    {
      label: 'Total Estimated Value',
      value: formatCurrency(kpis.total_estimated_value, currency),
      numericValue: kpis.total_estimated_value,
      valueFormat: 'currency' as const,
      icon: CircleDollarSign,
      highlight: true,
    },
    {
      label: 'Average Markup',
      value: `${kpis.average_markup_percent.toFixed(1)}%`,
      numericValue: kpis.average_markup_percent,
      valueFormat: 'percent' as const,
      decimals: 1,
      icon: Percent,
      highlight: false,
    },
    {
      label: 'Average Profit',
      value: formatCurrency(kpis.average_profit, currency),
      numericValue: kpis.average_profit,
      valueFormat: 'currency' as const,
      icon: CircleDollarSign,
      highlight: false,
    },
    {
      label: 'Avg Cost / Project',
      value: formatCurrency(kpis.average_cost_per_project, currency),
      numericValue: kpis.average_cost_per_project,
      valueFormat: 'currency' as const,
      icon: CircleDollarSign,
      highlight: false,
    },
  ];

  return (
    <section aria-label="Portfolio key metrics">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <ExecutiveKpiCard
            key={card.label}
            label={card.label}
            value={card.value}
            numericValue={card.numericValue}
            valueFormat={card.valueFormat}
            decimals={'decimals' in card ? card.decimals : undefined}
            icon={card.icon}
            highlight={card.highlight}
            index={index}
            className={card.highlight ? 'sm:col-span-2 lg:col-span-2' : undefined}
          />
        ))}
      </div>
    </section>
  );
}
