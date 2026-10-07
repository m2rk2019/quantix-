import type { CurrencyCode, ProjectStatus } from './project';

/** Executive lifecycle buckets shown on the portfolio dashboard. */
export type ExecutiveProjectStatus =
  | 'draft'
  | 'estimating'
  | 'review'
  | 'submitted'
  | 'awarded'
  | 'archived';

export const EXECUTIVE_STATUS_LABELS: Record<ExecutiveProjectStatus, string> = {
  draft: 'Draft',
  estimating: 'Estimating',
  review: 'Review',
  submitted: 'Submitted',
  awarded: 'Awarded',
  archived: 'Archived',
};

export type ExecutiveReportType =
  | 'executive_summary'
  | 'project_cost'
  | 'resource'
  | 'discipline'
  | 'risk'
  | 'ai_recommendation';

export const EXECUTIVE_REPORT_LABELS: Record<ExecutiveReportType, string> = {
  executive_summary: 'Executive Summary',
  project_cost: 'Project Cost Summary',
  resource: 'Resource Summary',
  discipline: 'Discipline Summary',
  risk: 'Risk Summary',
  ai_recommendation: 'AI Recommendation',
};

export interface DashboardFilters {
  search?: string;
  client?: string;
  location?: string;
  estimatorId?: string;
  status?: ProjectStatus[];
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface PortfolioKpis {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  draft_projects: number;
  total_estimated_value: number;
  average_markup_percent: number;
  average_profit: number;
  average_cost_per_project: number;
}

export interface PortfolioCostBreakdown {
  material: number;
  labor: number;
  equipment: number;
  subcontract: number;
  ocm: number;
  contingency: number;
  profit: number;
  vat: number;
  grand_total: number;
}

export interface PortfolioDisciplineItem {
  name: string;
  amount: number;
  percent: number;
}

export interface PortfolioWbsItem {
  code: string;
  name: string;
  amount: number;
}

export interface PortfolioTopCostItem {
  id: string;
  project_code: string;
  project_name: string;
  item_code: string;
  description: string;
  amount: number;
}

export interface PortfolioResourceUsage {
  material: number;
  labor: number;
  equipment: number;
  subcontract: number;
}

export interface ExecutiveStatusCount {
  status: ExecutiveProjectStatus;
  label: string;
  count: number;
}

export type AiInsightSeverity = 'info' | 'warning' | 'critical';

export type AiInsightCategory =
  | 'highest_discipline'
  | 'missing_scope'
  | 'duplicate_boq'
  | 'high_risk'
  | 'cost_saving'
  | 'rate_negotiation'
  | 'ai_confidence';

export interface ResourcePricingProjectSample {
  project_id: string;
  project_code: string;
  project_name: string;
  unit_cost: number;
}

export interface ResourcePricingInsightPayload {
  resource_name: string;
  company_average: number;
  current_quotation: number;
  percent_above_average: number;
  lowest: number;
  highest: number;
  negotiation_low: number;
  negotiation_high: number;
  recent_projects: ResourcePricingProjectSample[];
}

export interface AiPortfolioInsight {
  id: string;
  category: AiInsightCategory;
  severity: AiInsightSeverity;
  title: string;
  message: string;
  project_id?: string;
  project_code?: string;
  metric_value?: number;
  /** Structured payload for rate negotiation cards. */
  pricing?: ResourcePricingInsightPayload;
}

export interface DashboardProjectRow {
  id: string;
  project_code: string;
  project_name: string;
  client_name: string;
  location: string | null;
  status: ProjectStatus;
  executive_status: ExecutiveProjectStatus;
  created_by_name: string;
  created_by: string;
  updated_at: string;
  grand_total: number;
  currency: CurrencyCode;
  markup_percent: number;
  boq_item_count: number;
}

export interface EstimatorOption {
  id: string;
  full_name: string;
}

export interface ExecutiveDashboardData {
  generated_at: string;
  display_currency: CurrencyCode;
  mixed_currency_warning: boolean;
  kpis: PortfolioKpis;
  cost_breakdown: PortfolioCostBreakdown;
  discipline_breakdown: PortfolioDisciplineItem[];
  wbs_distribution: PortfolioWbsItem[];
  top_cost_items: PortfolioTopCostItem[];
  resource_usage: PortfolioResourceUsage;
  status_counts: ExecutiveStatusCount[];
  insights: AiPortfolioInsight[];
  ai_confidence_score: number;
  projects: DashboardProjectRow[];
  total_projects: number;
  page: number;
  page_size: number;
  total_pages: number;
  estimators: EstimatorOption[];
}
