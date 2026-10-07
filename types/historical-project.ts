/**
 * Phase 4 — Historical Projects Repository types.
 * Live project tables stay unchanged; historical_* tables hold immutable knowledge.
 */

export const HISTORICAL_SNAPSHOT_SECTIONS = [
  'project_information',
  'wbs',
  'boq',
  'project_resource_library',
  'estimate_summary',
  'ai_outputs',
  'executive_reports',
  'tender_package',
  'import_workbook',
  'validation_report',
  'ai_analysis',
] as const;

export type HistoricalSnapshotSection =
  (typeof HISTORICAL_SNAPSHOT_SECTIONS)[number];

export const HISTORICAL_SNAPSHOT_SECTION_LABELS: Record<
  HistoricalSnapshotSection,
  string
> = {
  project_information: 'Project Information',
  wbs: 'WBS',
  boq: 'BOQ',
  project_resource_library: 'Project Resource Library',
  estimate_summary: 'Estimate Summary',
  ai_outputs: 'AI Outputs',
  executive_reports: 'Executive Reports',
  tender_package: 'Tender Package',
  import_workbook: 'Original Import Workbook',
  validation_report: 'Validation Report',
  ai_analysis: 'AI Analysis',
};

export interface HistoricalProjectListItem {
  id: string;
  source_project_id: string | null;
  project_code: string;
  project_name: string;
  client_name: string;
  location: string | null;
  building_type: string | null;
  project_type: string | null;
  discipline_tags: string[];
  resource_tags: string[];
  supplier_tags: string[];
  estimate_date: string | null;
  source_status: string | null;
  archive_version: number;
  grand_total: number;
  direct_cost: number;
  boq_item_count: number;
  wbs_node_count: number;
  resource_count: number;
  archived_at: string;
  is_benchmark_eligible: boolean;
  cost_intelligence_ready: boolean;
}

export interface HistoricalProjectSearchParams {
  page?: number;
  pageSize?: number;
  /** Free-text across name / client / location / code */
  project_name?: string;
  client?: string;
  location?: string;
  building_type?: string;
  discipline?: string;
  resource?: string;
  supplier?: string;
  date_from?: string;
  date_to?: string;
  q?: string;
  sort?: 'estimate_date' | 'project_name' | 'client_name' | 'grand_total' | 'archived_at';
  order?: 'asc' | 'desc';
}

export interface HistoricalProjectListResult {
  projects: HistoricalProjectListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface HistoricalSnapshotRecord {
  section: HistoricalSnapshotSection;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface HistoricalProjectDetail extends HistoricalProjectListItem {
  contract_type: string | null;
  currency: string;
  indirect_cost: number;
  contingency: number;
  markup: number;
  vat: number;
  archived_by: string | null;
  snapshots: HistoricalSnapshotRecord[];
}

export interface CloneHistoricalProjectInput {
  historicalProjectId: string;
  project_name?: string;
  client_name?: string;
  location?: string | null;
}
