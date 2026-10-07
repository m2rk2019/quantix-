import type { EstimateBreakdown, EstimatePercentages } from '@/types/estimate';

export type BenchmarkArchetype =
  | 'office'
  | 'condominium'
  | 'warehouse'
  | 'commercial'
  | 'infrastructure';

export const BENCHMARK_ARCHETYPE_LABELS: Record<BenchmarkArchetype, string> = {
  office: 'Office Building',
  condominium: 'Condominium',
  warehouse: 'Warehouse',
  commercial: 'Commercial Building',
  infrastructure: 'Infrastructure',
};

export type BenchmarkImportFormat = 'xlsx' | 'csv';

export type BenchmarkImportSection =
  | 'metadata'
  | 'wbs'
  | 'boq'
  | 'rate_library'
  | 'estimate_summary'
  | 'benchmark_actuals';

export interface BenchmarkImportMetadata {
  project_name: string;
  client_name: string;
  location?: string;
  description?: string;
  currency?: string;
  project_type?: string;
  is_benchmark?: boolean;
}

export interface BenchmarkImportWbsRow {
  wbs_code: string;
  description: string;
  parent_code?: string;
}

export interface BenchmarkImportBoqRow {
  item_code: string;
  wbs_code: string;
  description: string;
  unit: string;
  quantity: number;
  material_rate: number;
  labor_rate: number;
  equipment_rate: number;
  subcontract_rate: number;
  other_cost_rate?: number;
  actual_quantity?: number;
  actual_unit_rate?: number;
  awarded_cost?: number;
}

export interface BenchmarkImportSummary {
  direct_cost?: number;
  indirect_cost_percent?: number;
  contingency_percent?: number;
  markup_percent?: number;
  vat_percent?: number;
}

export interface BenchmarkImportBundle {
  metadata: BenchmarkImportMetadata;
  wbs: BenchmarkImportWbsRow[];
  boq: BenchmarkImportBoqRow[];
  summary?: BenchmarkImportSummary;
}

export interface BenchmarkComparisonRow {
  id: string;
  item_code: string;
  description: string;
  estimated_quantity: number;
  actual_quantity: number;
  quantity_variance: number;
  quantity_variance_percent: number;
  estimated_unit_rate: number;
  actual_unit_rate: number;
  rate_variance: number;
  rate_variance_percent: number;
  estimated_cost: number;
  actual_cost: number;
  awarded_cost: number;
  cost_variance: number;
  cost_variance_percent: number;
}

export type BenchmarkFindingSeverity = 'info' | 'warning' | 'critical';

export interface BenchmarkFinding {
  id: string;
  severity: BenchmarkFindingSeverity;
  category: 'quantity' | 'rate' | 'cost' | 'formula';
  title: string;
  message: string;
  item_code?: string;
}

export interface BenchmarkValidationResult {
  project_id: string;
  project_code: string;
  project_name: string;
  archetype: BenchmarkArchetype | null;
  rows: BenchmarkComparisonRow[];
  findings: BenchmarkFinding[];
  quantity_accuracy_percent: number;
  rate_accuracy_percent: number;
  cost_accuracy_percent: number;
  formula_accuracy_percent: number;
  calculation_consistency_percent: number;
  meets_acceptance: boolean;
}

export interface FormulaAuditLine {
  item_code: string;
  description: string;
  quantity_formula: string;
  rate_formula: string;
  quantity: number;
  material_rate: number;
  labor_rate: number;
  equipment_rate: number;
  subcontract_rate: number;
  other_cost_rate: number;
  total_rate: number;
  total_amount: number;
  resource_breakdown: Array<{ category: string; amount: number }>;
  markup_breakdown: EstimateBreakdown;
  percentages: EstimatePercentages;
  line_share_of_direct: number;
  passed: boolean;
  issues: string[];
}

export interface FormulaAuditResult {
  project_id: string;
  lines: FormulaAuditLine[];
  passed_count: number;
  failed_count: number;
  accuracy_percent: number;
}

export interface AccuracyDashboardData {
  generated_at: string;
  overall_accuracy_percent: number;
  quantity_accuracy_percent: number;
  rate_accuracy_percent: number;
  cost_accuracy_percent: number;
  formula_accuracy_percent: number;
  calculation_consistency_percent: number;
  meets_acceptance: boolean;
  project_results: BenchmarkValidationResult[];
  largest_overruns: BenchmarkComparisonRow[];
  largest_savings: BenchmarkComparisonRow[];
  variance_heatmap: Array<{
    project_code: string;
    archetype: string;
    quantity_variance_percent: number;
    rate_variance_percent: number;
    cost_variance_percent: number;
  }>;
  lessons_learned: string[];
}

export type BenchmarkReportType =
  | 'formula_audit'
  | 'validation'
  | 'executive_accuracy'
  | 'lessons_learned';

export const BENCHMARK_REPORT_LABELS: Record<BenchmarkReportType, string> = {
  formula_audit: 'Formula Audit Report',
  validation: 'Validation Report',
  executive_accuracy: 'Executive Accuracy Dashboard',
  lessons_learned: 'Lessons Learned Report',
};
