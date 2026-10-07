export type RateLibraryCategory =
  | 'material'
  | 'labor'
  | 'equipment'
  | 'subcontract'
  | 'service'
  | 'productivity';

export const RATE_LIBRARY_CATEGORIES: readonly RateLibraryCategory[] = [
  'material',
  'labor',
  'equipment',
  'subcontract',
  'service',
  'productivity',
] as const;

export const RATE_LIBRARY_CATEGORY_LABELS: Record<RateLibraryCategory, string> = {
  material: 'Material',
  labor: 'Labor',
  equipment: 'Equipment',
  subcontract: 'Subcontract',
  service: 'Services',
  productivity: 'Productivity',
};

export function isRateLibraryCategory(value: string): value is RateLibraryCategory {
  return (RATE_LIBRARY_CATEGORIES as readonly string[]).includes(value);
}

export interface RateLibraryItem {
  id: string;
  code: string;
  description: string;
  unit: string;
  unit_cost: number;
  category: RateLibraryCategory;
  is_active: boolean;
  is_favorite?: boolean;
  created_at: string;
  updated_at: string;
}

export interface RateLibraryListParams {
  category?: RateLibraryCategory | 'all';
  search?: string;
  activeOnly?: boolean;
  favoritesOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface RateLibraryListResult {
  items: RateLibraryItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateRateLibraryItemInput {
  code: string;
  description: string;
  unit: string;
  unit_cost: number;
  category: RateLibraryCategory;
  is_active?: boolean;
}

export interface UpdateRateLibraryItemInput {
  code?: string;
  description?: string;
  unit?: string;
  unit_cost?: number;
  category?: RateLibraryCategory;
  is_active?: boolean;
}

export interface RateAnalysisLine {
  id: string;
  boq_item_id: string;
  library_item_id: string | null;
  /** Project Resource Library copy — preferred when project library is populated. */
  project_library_item_id: string | null;
  category: RateLibraryCategory;
  resource_name: string;
  unit: string;
  consumption: number;
  unit_cost: number;
  waste_percent: number;
  productivity: number | null;
  amount: number;
  sort_order: number;
  library_unit_cost?: number | null;
  is_stale?: boolean;
  /** Which library supplied the live comparison cost. */
  resource_source?: 'project' | 'company' | null;
}

export interface RateAnalysisLineInput {
  id?: string;
  library_item_id?: string | null;
  project_library_item_id?: string | null;
  category: RateLibraryCategory;
  resource_name: string;
  unit: string;
  consumption: number;
  unit_cost: number;
  waste_percent?: number;
  productivity?: number | null;
  sort_order?: number;
}

export interface RateBuildUpMarkups {
  ocm_percent: number;
  contingency_percent: number;
  profit_percent: number;
  vat_percent: number;
}

export interface RateBuildUpSummary {
  direct_cost: number;
  ocm: number;
  contingency: number;
  profit: number;
  vat: number;
  final_rate: number;
}

export interface RateAnalysisData {
  boqItemId: string;
  itemCode: string;
  description: string;
  unit: string;
  lines: RateAnalysisLine[];
  categoryTotals: Record<RateLibraryCategory, number>;
  buildUp: RateBuildUpSummary;
  markups: RateBuildUpMarkups;
  projectMarkups: RateBuildUpMarkups;
  overrides: {
    material_rate_override: boolean;
    labor_rate_override: boolean;
    equipment_rate_override: boolean;
    subcontract_rate_override: boolean;
    other_cost_rate_override: boolean;
  };
  currentRates: {
    material_rate: number;
    labor_rate: number;
    equipment_rate: number;
    subcontract_rate: number;
    other_cost_rate: number;
  };
  staleLineCount: number;
  /** Project Resource Library when non-empty; otherwise company fallback. */
  resourceSource: 'project' | 'company';
  projectResourceCount: number;
}

export interface SaveRateAnalysisInput {
  lines: RateAnalysisLineInput[];
  markups?: Partial<RateBuildUpMarkups>;
  clearOverrides?: RateLibraryCategory[];
  refreshStaleLibraryRates?: boolean;
}
