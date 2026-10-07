import type { RateLibraryCategory } from '@/types/rate-library';

export interface ProjectRateLibraryItem {
  id: string;
  project_id: string;
  code: string;
  description: string;
  unit: string;
  unit_cost: number;
  category: RateLibraryCategory;
  is_active: boolean;
  supplier_id: string | null;
  unit_id: string | null;
  resource_category_id: string | null;
  source_company_item_id: string | null;
  source_unit_cost: number | null;
  source_updated_at: string | null;
  ignore_company_updates: boolean;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectRateLibraryListParams {
  projectId: string;
  category?: RateLibraryCategory | 'all';
  search?: string;
  activeOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ProjectRateLibraryListResult {
  items: ProjectRateLibraryItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateProjectRateItemInput {
  project_id: string;
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

export interface UpdateProjectRateItemInput {
  code?: string;
  description?: string;
  unit?: string;
  unit_cost?: number;
  category?: RateLibraryCategory;
  is_active?: boolean;
  supplier_id?: string | null;
  unit_id?: string | null;
  resource_category_id?: string | null;
  ignore_company_updates?: boolean;
}

export interface ImportCompanyResourcesResult {
  success: boolean;
  error?: string;
  importedCount?: number;
  skippedCount?: number;
  importedIds?: string[];
}

export interface ProjectRateStaleItem {
  project_item_id: string;
  source_company_item_id: string;
  code: string;
  description: string;
  category: RateLibraryCategory;
  project_unit_cost: number;
  company_unit_cost: number;
  source_unit_cost: number | null;
  company_updated_at: string;
  source_updated_at: string | null;
}

export interface SyncProjectRatesResult {
  success: boolean;
  error?: string;
  updatedCount?: number;
  updatedIds?: string[];
}

export interface BulkProjectRateResult {
  success: boolean;
  error?: string;
  affectedCount?: number;
  affectedIds?: string[];
}
