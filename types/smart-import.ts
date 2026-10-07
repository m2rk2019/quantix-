/**
 * Phase 7 — AI Smart Excel Import Engine types.
 */

export type SmartImportSheetRole =
  | 'project_info'
  | 'bid_summary'
  | 'boq'
  | 'cost_breakdown'
  | 'resource_analysis'
  | 'summary'
  | 'assumptions'
  | 'notes'
  | 'unknown';

export type SmartImportJobStatus =
  | 'uploaded'
  | 'analyzing'
  | 'mapped'
  | 'importing'
  | 'validating'
  | 'completed'
  | 'failed'
  | 'needs_review';

export type ResourceMatchStatus = 'matched' | 'needs_review' | 'missing';

export interface SmartImportProjectInfo {
  project_name: string;
  client_name: string;
  location: string | null;
  building_type: string | null;
  contract_type: string | null;
  project_category: string | null;
  cfa_sqm: number | null;
  number_of_buildings: number | null;
  number_of_units: number | null;
  estimate_date: string | null;
  revision: string | null;
  currency: string | null;
  prepared_by: string | null;
}

export interface SmartImportBoqRow {
  row_index: number;
  item_number: string;
  description: string;
  unit: string;
  quantity: number;
  unit_rate: number;
  amount: number;
  is_group_header: boolean;
  group_path: string[];
  discipline: string;
  sort_order: number;
}

export interface SmartImportResourceRow {
  code: string;
  description: string;
  unit: string;
  unit_cost: number;
  category: string;
}

export interface SmartImportResourceMatch {
  source_description: string;
  status: ResourceMatchStatus;
  confidence: number;
  matched_code: string | null;
  matched_id: string | null;
  matched_source: 'project' | 'company' | 'ai_similar' | null;
  suggested_category: string | null;
}

export interface SmartImportValidationIssue {
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  row_index?: number;
}

export interface SmartImportValidationReport {
  issues: SmartImportValidationIssue[];
  error_count: number;
  warning_count: number;
  boq_count: number;
  wbs_count: number;
  resource_count: number;
  matched_count: number;
  needs_review_count: number;
  missing_count: number;
}

export interface ClassifiedSheet {
  sheet_name: string;
  role: SmartImportSheetRole;
  confidence: number;
  header_row: number | null;
  columns: Partial<Record<string, number>>;
  sample_headers: string[];
}

export interface SmartImportAnalysis {
  profile_key: string | null;
  profile_display_name: string | null;
  sheets: ClassifiedSheet[];
  project_info: SmartImportProjectInfo;
  boq_rows: SmartImportBoqRow[];
  resource_rows: SmartImportResourceRow[];
  assumptions: string;
  exclusions: string;
  notes: string;
  bid_summary: Record<string, number>;
  ai_findings: string[];
}

export const DISCIPLINE_KEYWORDS: Array<{ discipline: string; keywords: string[] }> = [
  { discipline: 'General Requirements', keywords: ['general requirement', 'preliminar', 'temporary', 'mobilization', 'hse', 'safety'] },
  { discipline: 'Civil', keywords: ['civil', 'earthwork', 'excavation', 'backfill', 'grading'] },
  { discipline: 'Structural', keywords: ['structural', 'concrete', 'rebar', 'reinforc', 'formwork', 'steel frame'] },
  { discipline: 'Architectural', keywords: ['architectural', 'masonry', 'finishes', 'painting', 'ceiling', 'flooring', 'doors', 'windows'] },
  { discipline: 'Plumbing', keywords: ['plumbing', 'water supply', 'fixture'] },
  { discipline: 'Sanitary', keywords: ['sanitary', 'sewer', 'waste water'] },
  { discipline: 'Mechanical', keywords: ['mechanical', 'hvac', 'acmv', 'ventilation', 'chiller'] },
  { discipline: 'Electrical', keywords: ['electrical', 'power', 'lighting', 'panelboard', 'cable tray'] },
  { discipline: 'Fire Protection', keywords: ['fire protection', 'sprinkler', 'fire alarm', 'fire hose'] },
  { discipline: 'External Works', keywords: ['external', 'landscape', 'road', 'pavement', 'site development'] },
  { discipline: 'Utilities', keywords: ['utilities', 'utility', 'service connection'] },
  { discipline: 'Testing', keywords: ['testing', 'commission test', 'pressure test'] },
  { discipline: 'Commissioning', keywords: ['commissioning', 'start-up', 'startup'] },
  { discipline: 'Turnover', keywords: ['turnover', 'handover', 'as-built', 'training'] },
];

export const MCC_PROFILE_KEY = 'mcc_budgetary_cost_breakdown';
export const MCC_PROFILE_NAME = 'MCC Budgetary Cost Breakdown';
