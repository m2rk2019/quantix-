import type { ProjectRateLibraryItem } from '@/types/project-rate-library';
import type { Database } from '@/types/database';

type ProjectRateRow =
  Database['public']['Tables']['project_rate_library_items']['Row'];

export function mapProjectRateRow(row: ProjectRateRow): ProjectRateLibraryItem {
  return {
    id: row.id,
    project_id: row.project_id,
    code: row.code,
    description: row.description,
    unit: row.unit,
    unit_cost: Number(row.unit_cost),
    category: row.category,
    is_active: row.is_active,
    supplier_id: row.supplier_id,
    unit_id: row.unit_id,
    resource_category_id: row.resource_category_id,
    source_company_item_id: row.source_company_item_id,
    source_unit_cost:
      row.source_unit_cost === null ? null : Number(row.source_unit_cost),
    source_updated_at: row.source_updated_at,
    ignore_company_updates: row.ignore_company_updates,
    is_custom: row.source_company_item_id === null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
