'use client';

import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ROUTES } from '@/lib/constants/routes';
import { formatCurrencyPHP } from '@/lib/format-currency';
import type {
  AiPortfolioInsight,
  ExecutiveDashboardData,
  ResourcePricingInsightPayload,
} from '@/types/dashboard';

const DASHBOARD_CARD =
  'rounded-2xl border border-border/60 bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04),0_6px_20px_rgb(0_0_0/0.05)]';

const SEVERITY_VARIANT: Record<
  AiPortfolioInsight['severity'],
  'default' | 'secondary' | 'destructive'
> = {
  info: 'secondary',
  warning: 'default',
  critical: 'destructive',
};

interface AiInsightsPanelProps {
  data: ExecutiveDashboardData;
}

function RateNegotiationCard({
  insight,
  pricing,
}: {
  insight: AiPortfolioInsight;
  pricing: ResourcePricingInsightPayload;
}): React.JSX.Element {
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={SEVERITY_VARIANT[insight.severity]}>
          {insight.severity}
        </Badge>
        <span className="text-sm font-semibold text-foreground">
          {pricing.resource_name}
        </span>
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          AI Insight
        </span>
      </div>

      <dl className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
        <div className="flex justify-between gap-3 sm:block">
          <dt className="text-muted-foreground">Company Average</dt>
          <dd className="font-medium tabular-nums">
            {formatCurrencyPHP(pricing.company_average)}
          </dd>
        </div>
        {pricing.recent_projects.map((sample) => (
          <div key={sample.project_id} className="flex justify-between gap-3 sm:block">
            <dt className="text-muted-foreground">{sample.project_code}</dt>
            <dd className="font-medium tabular-nums">
              {formatCurrencyPHP(sample.unit_cost)}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 rounded-lg border border-border/60 bg-white px-3 py-2.5">
        <p className="text-xs text-muted-foreground">Current quotation</p>
        <p className="text-lg font-semibold tabular-nums text-foreground">
          {formatCurrencyPHP(pricing.current_quotation)}
        </p>
        <p className="mt-1 text-sm font-medium text-amber-700">
          ⚠ {pricing.percent_above_average.toFixed(1)}% above company average
        </p>
      </div>

      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground">Recent projects</p>
          <p className="tabular-nums">
            Lowest : {formatCurrencyPHP(pricing.lowest)}
          </p>
          <p className="tabular-nums">
            Highest: {formatCurrencyPHP(pricing.highest)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">
            Recommended negotiation target
          </p>
          <p className="font-semibold tabular-nums text-foreground">
            {formatCurrencyPHP(pricing.negotiation_low)}–
            {formatCurrencyPHP(pricing.negotiation_high)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AiInsightsPanel({
  data,
}: AiInsightsPanelProps): React.JSX.Element {
  return (
    <Card className={DASHBOARD_CARD}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">AI Insights</CardTitle>
        <CardDescription>
          Automatic portfolio analysis · Confidence{' '}
          {(data.ai_confidence_score * 100).toFixed(0)}%
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.insights.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No insights available for the current portfolio view.
          </p>
        ) : (
          data.insights.map((insight) =>
            insight.category === 'rate_negotiation' && insight.pricing ? (
              <RateNegotiationCard
                key={insight.id}
                insight={insight}
                pricing={insight.pricing}
              />
            ) : (
              <div
                key={insight.id}
                className="rounded-xl border border-border/60 bg-[#F8FAFC] p-3.5 transition-colors hover:border-[#E31E24]/20"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={SEVERITY_VARIANT[insight.severity]}>
                    {insight.severity}
                  </Badge>
                  <span className="text-sm font-medium">{insight.title}</span>
                  {insight.project_code && insight.project_id && (
                    <Link
                      href={ROUTES.project(insight.project_id)}
                      className="text-xs text-primary hover:underline"
                    >
                      {insight.project_code}
                    </Link>
                  )}
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {insight.message}
                </p>
              </div>
            )
          )
        )}
      </CardContent>
    </Card>
  );
}
