import { formatCurrencyPHP } from '@/lib/format-currency';
import type {
  AiPortfolioInsight,
  ResourcePricingInsightPayload,
  ResourcePricingProjectSample,
} from '@/types/dashboard';

export interface ProjectResourceRateRow {
  id: string;
  project_id: string;
  project_code: string;
  project_name: string;
  code: string;
  description: string;
  unit_cost: number;
  category: string;
  updated_at: string;
}

export interface CompanyResourceRateRow {
  id: string;
  code: string;
  description: string;
  unit_cost: number;
  category: string;
}

function normalizeResourceKey(code: string, description: string): string {
  const raw = `${code} ${description}`.toLowerCase();
  return raw
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function displayName(code: string, description: string): string {
  const desc = description.trim();
  if (desc.length >= 4) {
    return desc;
  }
  return code.trim() || desc || 'Resource';
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundToNearest(value: number, step = 50): number {
  return Math.round(value / step) * step;
}

/**
 * Negotiation band sits modestly above the company/project average —
 * tight enough for commercial pressure, realistic vs recent awards.
 * Rounded to ₱50 so targets read as commercial figures (e.g. 5300–5450).
 */
export function computeNegotiationBand(companyAverage: number): {
  low: number;
  high: number;
} {
  const step = companyAverage >= 1000 ? 50 : 1;
  const low = roundToNearest(companyAverage * 1.01, step);
  const high = Math.max(
    low + step,
    roundToNearest(companyAverage * 1.038, step)
  );
  return { low, high };
}

export function buildResourcePricingInsights(input: {
  projectRates: ProjectResourceRateRow[];
  companyRates: CompanyResourceRateRow[];
  /** Minimum % above average to raise a negotiation insight. */
  thresholdPercent?: number;
  maxInsights?: number;
}): AiPortfolioInsight[] {
  const threshold = input.thresholdPercent ?? 5;
  const maxInsights = input.maxInsights ?? 3;

  type Bucket = {
    key: string;
    name: string;
    samples: ResourcePricingProjectSample[];
    companyCost: number | null;
  };

  const buckets = new Map<string, Bucket>();

  for (const row of input.projectRates) {
    if (row.unit_cost <= 0) {
      continue;
    }
    const key = normalizeResourceKey(row.code, row.description);
    if (!key) {
      continue;
    }
    const existing = buckets.get(key) ?? {
      key,
      name: displayName(row.code, row.description),
      samples: [],
      companyCost: null,
    };
    // One sample per project (latest wins by updated_at order from caller).
    if (!existing.samples.some((sample) => sample.project_id === row.project_id)) {
      existing.samples.push({
        project_id: row.project_id,
        project_code: row.project_code,
        project_name: row.project_name,
        unit_cost: roundMoney(row.unit_cost),
      });
    }
    buckets.set(key, existing);
  }

  for (const company of input.companyRates) {
    const key = normalizeResourceKey(company.code, company.description);
    const bucket = buckets.get(key);
    if (!bucket) {
      continue;
    }
    bucket.companyCost = roundMoney(company.unit_cost);
    if (!bucket.name || bucket.name.length < company.description.trim().length) {
      bucket.name = displayName(company.code, company.description);
    }
  }

  const insights: AiPortfolioInsight[] = [];

  for (const bucket of buckets.values()) {
    if (bucket.samples.length < 2) {
      continue;
    }

    const costs = bucket.samples.map((sample) => sample.unit_cost);
    // Historical portfolio average from project awards (shown as Company Average).
    const companyAverage = roundMoney(
      costs.reduce((sum, value) => sum + value, 0) / costs.length
    );
    const lowest = Math.min(...costs);
    const highest = Math.max(...costs);

    // Company master catalog rate = current quotation being challenged.
    // Without a master rate above history, skip — nothing to negotiate down.
    if (bucket.companyCost === null || bucket.companyCost <= companyAverage) {
      continue;
    }
    const currentQuotation = roundMoney(bucket.companyCost);

    const percentAbove =
      ((currentQuotation - companyAverage) / companyAverage) * 100;
    if (percentAbove < threshold) {
      continue;
    }

    const band = computeNegotiationBand(companyAverage);
    const pricing: ResourcePricingInsightPayload = {
      resource_name: bucket.name,
      company_average: companyAverage,
      current_quotation: currentQuotation,
      percent_above_average: roundMoney(percentAbove),
      lowest: roundMoney(lowest),
      highest: roundMoney(highest),
      negotiation_low: band.low,
      negotiation_high: band.high,
      recent_projects: [...bucket.samples].sort(
        (a, b) => a.unit_cost - b.unit_cost
      ),
    };

    insights.push({
      id: `insight-rate-${bucket.key.slice(0, 48)}`,
      category: 'rate_negotiation',
      severity: percentAbove >= 10 ? 'warning' : 'info',
      title: bucket.name,
      message: `Current quotation ${formatCurrencyPHP(currentQuotation)} is ${percentAbove.toFixed(1)}% above company average ${formatCurrencyPHP(companyAverage)}. Negotiate toward ${formatCurrencyPHP(band.low)}–${formatCurrencyPHP(band.high)}.`,
      metric_value: percentAbove,
      pricing,
    });
  }

  return insights
    .sort(
      (a, b) => (b.metric_value ?? 0) - (a.metric_value ?? 0)
    )
    .slice(0, maxInsights);
}
