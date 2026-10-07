export interface BoqRateFields {
  material_rate: number;
  labor_rate: number;
  equipment_rate: number;
  subcontract_rate: number;
  other_cost_rate: number;
}

export interface BoqRateOverrides {
  material_rate_override: boolean;
  labor_rate_override: boolean;
  equipment_rate_override: boolean;
  subcontract_rate_override: boolean;
  other_cost_rate_override: boolean;
}

export interface BoqItem extends BoqRateFields, BoqRateOverrides {
  id: string;
  project_id: string;
  wbs_id: string;
  wbs_code: string;
  wbs_description: string;
  item_code: string;
  description: string;
  unit: string;
  quantity: number;
  total_rate: number;
  total_amount: number;
  /** Template reuse match classification (nullable when unused). */
  template_match_status?: string | null;
  /** True when item needs estimator review after template reuse import. */
  needs_estimator_review?: boolean;
  source_workbook?: string | null;
  source_sheet?: string | null;
  source_row?: number | null;
  imported_at?: string | null;
  match_confidence?: number | null;
  /**
   * Phase 5 — quantity provenance.
   * takeoff | excel_import | manual (derived when null).
   */
  quantity_source?: 'takeoff' | 'excel_import' | 'manual' | null;
  /** Phase 5 — first linked takeoff measurement id (for reverse nav). */
  takeoff_measurement_id?: string | null;
  /** Phase 5 — count of linked takeoff measurements. */
  takeoff_link_count?: number;
  created_at: string;
  updated_at: string;
}

export type BoqSortField =
  | 'wbs_order'
  | 'item_code'
  | 'description'
  | 'unit'
  | 'quantity'
  | 'material_rate'
  | 'labor_rate'
  | 'equipment_rate'
  | 'subcontract_rate'
  | 'other_cost_rate'
  | 'total_rate'
  | 'total_amount';

export type BoqEditableField =
  | 'item_code'
  | 'description'
  | 'unit'
  | 'quantity'
  | 'material_rate'
  | 'labor_rate'
  | 'equipment_rate'
  | 'subcontract_rate'
  | 'other_cost_rate';

export const BOQ_EDITABLE_FIELDS: readonly BoqEditableField[] = [
  'item_code',
  'description',
  'unit',
  'quantity',
  'material_rate',
  'labor_rate',
  'equipment_rate',
  'subcontract_rate',
  'other_cost_rate',
] as const;

export interface BoqListParams {
  wbsId?: string | null;
  search?: string;
  sort?: BoqSortField;
  order?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface BoqListResult {
  items: BoqItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BoqTotals {
  wbsSubtotal: number;
  projectTotal: number;
  categoryTotals: BoqCategoryTotals;
}

export interface BoqCategoryTotals {
  materialTotal: number;
  laborTotal: number;
  equipmentTotal: number;
  subcontractTotal: number;
  grandTotal: number;
}

export interface CreateBoqItemInput {
  project_id: string;
  wbs_id: string;
  item_code?: string;
  description?: string;
  unit?: string;
  quantity?: number;
  material_rate?: number;
  labor_rate?: number;
  equipment_rate?: number;
  subcontract_rate?: number;
  other_cost_rate?: number;
}

export interface UpdateBoqItemInput {
  wbs_id?: string;
  item_code?: string;
  description?: string;
  unit?: string;
  quantity?: number;
  material_rate?: number;
  labor_rate?: number;
  equipment_rate?: number;
  subcontract_rate?: number;
  other_cost_rate?: number;
  material_rate_override?: boolean;
  labor_rate_override?: boolean;
  equipment_rate_override?: boolean;
  subcontract_rate_override?: boolean;
  other_cost_rate_override?: boolean;
}

export interface WbsFilterOption {
  id: string;
  wbs_code: string;
  description: string;
  level: number;
}

export interface BoqClipboardRow {
  item_code: string;
  description: string;
  unit: string;
  quantity: number;
  material_rate: number;
  labor_rate: number;
  equipment_rate: number;
  subcontract_rate: number;
  other_cost_rate: number;
}
