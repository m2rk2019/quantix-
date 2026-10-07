'use client';

import { LookupTableModule } from '@/features/resource-library/components/LookupTableModule';
import {
  createCompanyResourceCategoryAction,
  deleteCompanyResourceCategoryAction,
  exportCompanyResourceCategoriesAction,
  importCompanyResourceCategoriesAction,
  loadCompanyResourceCategoriesAction,
  updateCompanyResourceCategoryAction,
} from '@/services/resource-library/resource-library-actions';
import { parseCategoryImport } from '@/lib/resource-library/import-parsers';
import { RATE_LIBRARY_CATEGORY_LABELS } from '@/types/rate-library';
import type { CompanyResourceCategory, PaginatedResult } from '@/types/resource-library';

interface CategoryLibraryClientProps {
  canEdit: boolean;
  initialData: PaginatedResult<CompanyResourceCategory>;
}

export function CategoryLibraryClient({
  canEdit,
  initialData,
}: CategoryLibraryClientProps): React.JSX.Element {
  return (
    <LookupTableModule
      title="Resource Categories"
      canEdit={canEdit}
      initialItems={initialData.items}
      initialPage={initialData.page}
      initialTotalPages={initialData.totalPages}
      columns={[
        { key: 'code', label: 'Code', editable: true, onBlur: (item, value) => {
          void updateCompanyResourceCategoryAction(item.id, { code: value });
        }},
        { key: 'name', label: 'Name', editable: true, onBlur: (item, value) => {
          void updateCompanyResourceCategoryAction(item.id, { name: value });
        }},
        {
          key: 'resource_type',
          label: 'Resource Type',
          render: (item) => RATE_LIBRARY_CATEGORY_LABELS[item.resource_type],
        },
        { key: 'description', label: 'Description', editable: true, onBlur: (item, value) => {
          void updateCompanyResourceCategoryAction(item.id, { description: value });
        }},
        {
          key: 'is_active',
          label: 'Status',
          align: 'center',
          render: (item) => (
            <span className={item.is_active ? 'text-emerald-600' : 'text-muted-foreground'}>
              {item.is_active ? 'Active' : 'Inactive'}
            </span>
          ),
        },
      ]}
      onLoad={async (params) => {
        const result = await loadCompanyResourceCategoriesAction({
          search: params.search,
          activeOnly: params.activeOnly,
          page: params.page,
          pageSize: 50,
        });
        return { items: result.items, totalPages: result.totalPages };
      }}
      onAdd={async () =>
        createCompanyResourceCategoryAction({
          code: `CAT-${Date.now().toString().slice(-6)}`,
          name: 'New Category',
          resource_type: 'material',
          is_active: true,
        })
      }
      onDelete={deleteCompanyResourceCategoryAction}
      onImport={async (text) => {
        const rows = parseCategoryImport(text);
        if (rows.length === 0) {
          return { success: false, error: 'No valid rows found.' };
        }
        return importCompanyResourceCategoriesAction(rows);
      }}
      onExport={exportCompanyResourceCategoriesAction}
    />
  );
}
