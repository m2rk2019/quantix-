import type { RateLibraryCategory } from './rate-library';

export type ResourceLibrarySection =
  | 'materials'
  | 'labor'
  | 'equipment'
  | 'subcontract'
  | 'suppliers'
  | 'units'
  | 'categories';

export const RESOURCE_LIBRARY_SECTIONS: readonly ResourceLibrarySection[] = [
  'materials',
  'labor',
  'equipment',
  'subcontract',
  'suppliers',
  'units',
  'categories',
] as const;

export const RESOURCE_LIBRARY_SECTION_LABELS: Record<ResourceLibrarySection, string> = {
  materials: 'Material Library',
  labor: 'Labor Library',
  equipment: 'Equipment Library',
  subcontract: 'Subcontract Library',
  suppliers: 'Supplier Library',
  units: 'Units of Measure',
  categories: 'Resource Categories',
};

export const SECTION_TO_RESOURCE_TYPE: Partial<
  Record<ResourceLibrarySection, RateLibraryCategory>
> = {
  materials: 'material',
  labor: 'labor',
  equipment: 'equipment',
  subcontract: 'subcontract',
};

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ListQueryParams {
  search?: string;
  activeOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface CompanySupplier {
  id: string;
  code: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCompanySupplierInput {
  code: string;
  name: string;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  is_active?: boolean;
}

export interface UpdateCompanySupplierInput {
  code?: string;
  name?: string;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  is_active?: boolean;
}

export interface CompanyUnit {
  id: string;
  code: string;
  symbol: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCompanyUnitInput {
  code: string;
  symbol: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
}

export interface UpdateCompanyUnitInput {
  code?: string;
  symbol?: string;
  name?: string;
  description?: string | null;
  is_active?: boolean;
}

export interface CompanyResourceCategory {
  id: string;
  code: string;
  name: string;
  resource_type: RateLibraryCategory;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCompanyResourceCategoryInput {
  code: string;
  name: string;
  resource_type: RateLibraryCategory;
  description?: string | null;
  is_active?: boolean;
}

export interface UpdateCompanyResourceCategoryInput {
  code?: string;
  name?: string;
  resource_type?: RateLibraryCategory;
  description?: string | null;
  is_active?: boolean;
}

export interface CompanyResourceItem {
  id: string;
  code: string;
  description: string;
  unit: string;
  unit_cost: number;
  category: RateLibraryCategory;
  is_active: boolean;
  supplier_id: string | null;
  unit_id: string | null;
  resource_category_id: string | null;
  supplier_name: string | null;
  unit_symbol: string | null;
  resource_category_name: string | null;
  is_favorite?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompanyResourceListParams extends ListQueryParams {
  category: RateLibraryCategory;
  favoritesOnly?: boolean;
}

export interface CreateCompanyResourceInput {
  code: string;
  description: string;
  unit: string;
  unit_cost: number;
  category: RateLibraryCategory;
  is_active?: boolean;
  supplier_id?: string | null;
  unit_id?: string | null;
  resource_category_id?: string | null;
}

export interface UpdateCompanyResourceInput {
  code?: string;
  description?: string;
  unit?: string;
  unit_cost?: number;
  is_active?: boolean;
  supplier_id?: string | null;
  unit_id?: string | null;
  resource_category_id?: string | null;
}

export interface ResourceCategoryListParams extends ListQueryParams {
  resourceType?: RateLibraryCategory | 'all';
}
