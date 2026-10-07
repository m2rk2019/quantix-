/**
 * Phase 8 — Master Template + import reconciliation types.
 */

export interface ImportReconciliationLine {
  label: string;
  excel_value: number;
  quantix_value: number;
  variance: number;
  variance_percent: number;
  within_tolerance: boolean;
}

export interface ImportReconciliationReport {
  tolerance_percent: number;
  lines: ImportReconciliationLine[];
  excel_boq_total: number;
  quantix_direct_cost: number;
  excel_bid_price: number | null;
  quantix_grand_total: number;
  overall_pass: boolean;
  notes: string[];
}

export interface MasterTemplateListItem {
  id: string;
  template_key: string;
  /** Immutable version within the family, e.g. "1.0", "1.1". */
  template_version: string;
  display_name: string;
  description: string | null;
  source_project_id: string | null;
  created_from_project_id: string | null;
  wbs_count: number;
  boq_count: number;
  resource_count: number;
  is_active: boolean;
  /** True when this is the highest version for the template_key family. */
  is_latest_version: boolean;
  created_at: string;
  created_by_name: string;
}

export interface MasterTemplateSnapshot {
  project_info: {
    project_name: string;
    client_name: string;
    location: string | null;
    building_type: string | null;
    contract_type: string | null;
    currency: string;
    assumptions: string | null;
    exclusions: string | null;
    commercial_notes: string | null;
    vat_percent: number;
    markup_percent: number;
    contingency_percent: number;
    indirect_cost_percent: number;
  };
  wbs: Array<{
    id: string;
    parent_id: string | null;
    level: number;
    wbs_code: string;
    description: string;
    sort_order: number;
  }>;
  resources: Array<{
    id: string;
    code: string;
    description: string;
    unit: string;
    unit_cost: number;
    category: string;
  }>;
  boq: Array<{
    id: string;
    wbs_id: string;
    item_code: string;
    description: string;
    unit: string;
    quantity: number;
    material_rate: number;
    labor_rate: number;
    equipment_rate: number;
    subcontract_rate: number;
    other_cost_rate: number;
    total_rate: number;
    total_amount: number;
  }>;
  rate_analysis: Array<{
    boq_item_id: string;
    project_library_item_id: string | null;
    library_item_id: string | null;
    category: string;
    resource_name: string;
    unit: string;
    consumption: number;
    unit_cost: number;
    waste_percent: number;
    productivity: number | null;
    amount: number;
    sort_order: number;
  }>;
}

export const DEFAULT_IMPORT_TOLERANCE_PERCENT = 1;
