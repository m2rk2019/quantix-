'use client';

import { CompanyResourceModule } from '@/features/resource-library/components/CompanyResourceModule';
import { parseCompanyResourceImport } from '@/lib/resource-library/import-parsers';
import {
  createCompanyResourceAction,
  deleteCompanyResourceAction,
  exportCompanyResourcesAction,
  importCompanyResourcesAction,
  loadCompanyResourcesAction,
  updateCompanyResourceAction,
} from '@/services/resource-library/resource-library-actions';
import type { RateLibraryCategory } from '@/types/rate-library';
import { RATE_LIBRARY_CATEGORY_LABELS } from '@/types/rate-library';
import type {
  CompanyResourceCategory,
  CompanyResourceItem,
  CompanySupplier,
  CompanyUnit,
  PaginatedResult,
  UpdateCompanyResourceInput,
} from '@/types/resource-library';
import type { CurrencyCode } from '@/types/project';

interface ResourceTypeLibraryClientProps {
  category: RateLibraryCategory;
  canEdit: boolean;
  currency: CurrencyCode;
  initialData: PaginatedResult<CompanyResourceItem>;
  lookups: {
    suppliers: CompanySupplier[];
    units: CompanyUnit[];
    categories: CompanyResourceCategory[];
  };
}

export function ResourceTypeLibraryClient({
  category,
  canEdit,
  currency,
  initialData,
  lookups,
}: ResourceTypeLibraryClientProps): React.JSX.Element {
  return (
    <CompanyResourceModule
      category={category}
      title={RATE_LIBRARY_CATEGORY_LABELS[category] + ' Library'}
      canEdit={canEdit}
      currency={currency}
      initialData={initialData}
      lookups={lookups}
      onLoad={async (params) =>
        loadCompanyResourcesAction({
          category,
          search: params.search,
          activeOnly: params.activeOnly ? true : false,
          page: params.page,
          pageSize: 50,
        })
      }
      onAdd={async () =>
        createCompanyResourceAction({
          code: `RES-${Date.now().toString().slice(-6)}`,
          description: 'New resource',
          unit: 'item',
          unit_cost: 0,
          category,
          is_active: true,
        })
      }
      onUpdate={async (id, patch) =>
        updateCompanyResourceAction(id, patch as UpdateCompanyResourceInput)
      }
      onDelete={deleteCompanyResourceAction}
      onImport={async (text) => {
        const rows = parseCompanyResourceImport(text, category);
        if (rows.length === 0) {
          return { success: false, error: 'No valid rows found.' };
        }
        return importCompanyResourcesAction(rows);
      }}
      onExport={(format) => exportCompanyResourcesAction(category, format)}
    />
  );
}
