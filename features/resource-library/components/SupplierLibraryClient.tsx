'use client';

import { LookupTableModule } from '@/features/resource-library/components/LookupTableModule';
import {
  createCompanySupplierAction,
  deleteCompanySupplierAction,
  exportCompanySuppliersAction,
  importCompanySuppliersAction,
  loadCompanySuppliersAction,
  updateCompanySupplierAction,
} from '@/services/resource-library/resource-library-actions';
import { parseSupplierImport } from '@/lib/resource-library/import-parsers';
import type { CompanySupplier, PaginatedResult } from '@/types/resource-library';

interface SupplierLibraryClientProps {
  canEdit: boolean;
  initialData: PaginatedResult<CompanySupplier>;
}

export function SupplierLibraryClient({
  canEdit,
  initialData,
}: SupplierLibraryClientProps): React.JSX.Element {
  return (
    <LookupTableModule
      title="Supplier Library"
      canEdit={canEdit}
      initialItems={initialData.items}
      initialPage={initialData.page}
      initialTotalPages={initialData.totalPages}
      columns={[
        { key: 'code', label: 'Code', editable: true, onBlur: (item, value) => {
          void updateCompanySupplierAction(item.id, { code: value });
        }},
        { key: 'name', label: 'Name', editable: true, onBlur: (item, value) => {
          void updateCompanySupplierAction(item.id, { name: value });
        }},
        { key: 'contact_person', label: 'Contact', editable: true, onBlur: (item, value) => {
          void updateCompanySupplierAction(item.id, { contact_person: value });
        }},
        { key: 'email', label: 'Email', editable: true, onBlur: (item, value) => {
          void updateCompanySupplierAction(item.id, { email: value });
        }},
        { key: 'phone', label: 'Phone', editable: true, onBlur: (item, value) => {
          void updateCompanySupplierAction(item.id, { phone: value });
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
        const result = await loadCompanySuppliersAction({
          search: params.search,
          activeOnly: params.activeOnly,
          page: params.page,
          pageSize: 50,
        });
        return { items: result.items, totalPages: result.totalPages };
      }}
      onAdd={async () =>
        createCompanySupplierAction({
          code: `SUP-${Date.now().toString().slice(-6)}`,
          name: 'New Supplier',
          is_active: true,
        })
      }
      onDelete={deleteCompanySupplierAction}
      onImport={async (text) => {
        const rows = parseSupplierImport(text);
        if (rows.length === 0) {
          return { success: false, error: 'No valid rows found.' };
        }
        return importCompanySuppliersAction(rows);
      }}
      onExport={exportCompanySuppliersAction}
    />
  );
}
