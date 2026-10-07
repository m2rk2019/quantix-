import type { FormulaAuditResult } from '@/types/benchmark';

export type UatModuleId =
  | 'authentication'
  | 'company_settings'
  | 'projects'
  | 'wbs'
  | 'boq'
  | 'rate_library'
  | 'rate_analysis'
  | 'estimate_summary'
  | 'ai_estimator'
  | 'executive_dashboard'
  | 'historical_benchmark'
  | 'excel_export'
  | 'pdf_export'
  | 'validation'
  | 'audit_trail'
  | 'cross_cutting';

export const UAT_MODULE_LABELS: Record<UatModuleId, string> = {
  authentication: 'Authentication',
  company_settings: 'Company Settings',
  projects: 'Projects',
  wbs: 'WBS',
  boq: 'BOQ',
  rate_library: 'Rate Library',
  rate_analysis: 'Rate Analysis',
  estimate_summary: 'Estimate Summary',
  ai_estimator: 'AI Estimator',
  executive_dashboard: 'Executive Dashboard',
  historical_benchmark: 'Historical Benchmark',
  excel_export: 'Excel Export',
  pdf_export: 'PDF Export',
  validation: 'Validation',
  audit_trail: 'Audit Trail',
  cross_cutting: 'Cross-Cutting',
};

export interface UatScenario {
  id: string;
  module: UatModuleId;
  title: string;
  steps: string;
  expected: string;
  /** Linked automated verify script, if any */
  verifyScript?: string;
}

export interface UatAutomatedCheck {
  id: string;
  label: string;
  npmScript: string;
  module: UatModuleId;
  description: string;
}

export interface UatFormulaComparisonRow {
  item_code: string;
  description: string;
  manual_total_rate: number;
  system_total_rate: number;
  rate_variance: number;
  manual_total_amount: number;
  system_total_amount: number;
  amount_variance: number;
  passed: boolean;
}

export interface UatFormulaVerificationResult {
  project_id: string;
  project_code: string;
  project_name: string;
  rows: UatFormulaComparisonRow[];
  passed_count: number;
  failed_count: number;
  accuracy_percent: number;
  audit: FormulaAuditResult;
}

export type UatPerformanceMetricId =
  | 'load'
  | 'search'
  | 'save'
  | 'export'
  | 'large_boq';

export interface UatPerformanceResult {
  id: UatPerformanceMetricId;
  label: string;
  item_count?: number;
  duration_ms: number;
  threshold_ms: number;
  passed: boolean;
  detail?: string;
}

export interface UatPerformanceSuiteResult {
  results: UatPerformanceResult[];
  all_passed: boolean;
  run_at: string;
}

export interface UatChecklistSummary {
  total_scenarios: number;
  modules: Array<{
    module: UatModuleId;
    label: string;
    scenario_count: number;
  }>;
}

export interface UatSuiteDashboard {
  checklist: UatChecklistSummary;
  automated_checks: UatAutomatedCheck[];
  formula_verification: UatFormulaVerificationResult | null;
  performance: UatPerformanceSuiteResult;
}

export interface UatSuitePageData extends UatSuiteDashboard {
  scenarios: UatScenario[];
  projects: Array<{ id: string; project_code: string; project_name: string }>;
  selectedProjectId: string | null;
}

export type UatReportType =
  | 'full_checklist'
  | 'formula_verification'
  | 'performance'
  | 'automated_summary'
  | 'executive_uat';

export const UAT_REPORT_LABELS: Record<UatReportType, string> = {
  full_checklist: 'Full UAT Checklist',
  formula_verification: 'Formula Verification Report',
  performance: 'Performance Test Report',
  automated_summary: 'Automated Checks Summary',
  executive_uat: 'Executive UAT Summary',
};
