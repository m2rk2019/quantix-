import type { CurrencyCode } from '@/types/project';

export interface EstimateSummaryData {
  project_id: string;
  currency: CurrencyCode;
  percentages: EstimatePercentages;
  breakdown: EstimateBreakdown;
  resource_totals: BoqResourceTotals;
  boq_item_count: number;
  wbs_rollup: WbsRollupNode[];
  discipline_breakdown: DisciplineBreakdownItem[];
  top_boq_items: TopBoqItem[];
  bid_summary: BidSummaryData;
  monthly_cash_placeholder: Array<{ month: string; amount: number }>;
  updated_at: string;
}

export interface EstimatePercentages {
  indirect_cost_percent: number;
  contingency_percent: number;
  markup_percent: number;
  vat_percent: number;
}

export interface EstimateBreakdown {
  direct_cost: number;
  indirect_cost: number;
  contingency: number;
  markup: number;
  vat: number;
  grand_total: number;
}

export interface EstimateLineItem {
  key: string;
  label: string;
  percent: number | null;
  amount: number;
  highlight?: boolean;
  editable?: boolean;
  percentField?: keyof EstimatePercentages;
}

export interface BoqResourceTotals {
  material: number;
  labor: number;
  equipment: number;
  subcontract: number;
  other: number;
}

export interface WbsRollupNode {
  id: string;
  parent_id: string | null;
  wbs_code: string;
  description: string;
  level: number;
  sort_order: number;
  direct_total: number;
  combined_total: number;
  children: WbsRollupNode[];
}

export interface DisciplineBreakdownItem {
  id: string;
  code: string;
  name: string;
  amount: number;
  percent: number;
}

export interface TopBoqItem {
  id: string;
  item_code: string;
  description: string;
  amount: number;
}

export interface BidSummaryData {
  project_name: string;
  project_code: string;
  client_name: string;
  estimate_date: string;
  prepared_by: string;
  location: string;
  total_direct_cost: number;
  indirect_cost: number;
  markup: number;
  vat: number;
  grand_total: number;
  cost_per_square_meter: number | null;
}
