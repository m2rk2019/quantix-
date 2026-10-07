'use client';

import { LookupTableModule } from '@/features/resource-library/components/LookupTableModule';
import {
  createCompanyUnitAction,
  deleteCompanyUnitAction,
  exportCompanyUnitsAction,
  importCompanyUnitsAction,
  loadCompanyUnitsAction,
  updateCompanyUnitAction,
} from '@/services/resource-library/resource-library-actions';
import { parseUnitImport } from '@/lib/resource-library/import-parsers';
import type { CompanyUnit, PaginatedResult } from '@/types/resource-library';

interface UnitLibraryClientProps {
  canEdit: boolean;
  initialData: PaginatedResult<CompanyUnit>;
}

export function UnitLibraryClient({
  canEdit,
  initialData,
}: UnitLibraryClientProps): React.JSX.Element {
  return (
    <LookupTableModule
      title="Units of Measure"
      canEdit={canEdit}
      initialItems={initialData.items}
      initialPage={initialData.page}
      initialTotalPages={initialData.totalPages}
      columns={[
        { key: 'code', label: 'Code', editable: true, onBlur: (item, value) => {
          void updateCompanyUnitAction(item.id, { code: value });
        }},
        { key: 'symbol', label: 'Symbol', editable: true, onBlur: (item, value) => {
          void updateCompanyUnitAction(item.id, { symbol: value });
        }},
        { key: 'name', label: 'Name', editable: true, onBlur: (item, value) => {
          void updateCompanyUnitAction(item.id, { name: value });
        }},
        { key: 'description', label: 'Description', editable: true, onBlur: (item, value) => {
          void updateCompanyUnitAction(item.id, { description: value });
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
        const result = await loadCompanyUnitsAction({
          search: params.search,
          activeOnly: params.activeOnly,
          page: params.page,
          pageSize: 50,
        });
        return { items: result.items, totalPages: result.totalPages };
      }}
      onAdd={async () =>
        createCompanyUnitAction({
          code: `U-${Date.now().toString().slice(-6)}`,
          symbol: 'item',
          name: 'New Unit',
          is_active: true,
        })
      }
      onDelete={deleteCompanyUnitAction}
      onImport={async (text) => {
        const rows = parseUnitImport(text);
        if (rows.length === 0) {
          return { success: false, error: 'No valid rows found.' };
        }
        return importCompanyUnitsAction(rows);
      }}
      onExport={exportCompanyUnitsAction}
    />
  );
}
