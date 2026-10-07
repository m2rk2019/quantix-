import { notFound } from 'next/navigation';

import { ResourceTypeLibraryClient } from '@/features/resource-library/components/ResourceTypeLibraryClient';
import { getAuthUser } from '@/lib/auth/session';
import { canManageCompanyResources } from '@/lib/auth/permissions';
import {
  listCompanyResources,
} from '@/services/resource-library/company-resources';
import { loadResourceLookupsAction } from '@/services/resource-library/resource-library-actions';
import type { RateLibraryCategory } from '@/types/rate-library';

import { DEFAULT_CURRENCY } from '@/lib/format-currency';

export async function renderResourceTypePage(
  category: RateLibraryCategory
): Promise<React.JSX.Element> {
  const { profile } = await getAuthUser();
  if (!profile) {
    notFound();
  }

  const canEdit = canManageCompanyResources(profile.role);
  const [initialData, lookups] = await Promise.all([
    listCompanyResources({ category, page: 1, pageSize: 50, activeOnly: false }),
    loadResourceLookupsAction(category),
  ]);

  return (
    <ResourceTypeLibraryClient
      category={category}
      canEdit={canEdit}
      currency={DEFAULT_CURRENCY}
      initialData={initialData}
      lookups={lookups}
    />
  );
}
