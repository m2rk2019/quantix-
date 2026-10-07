import { notFound } from 'next/navigation';

import { CategoryLibraryClient } from '@/features/resource-library/components/CategoryLibraryClient';
import { getAuthUser } from '@/lib/auth/session';
import { canManageCompanyResources } from '@/lib/auth/permissions';
import { listCompanyResourceCategories } from '@/services/resource-library/categories';

export const dynamic = 'force-dynamic';

export default async function CategoryLibraryPage(): Promise<React.JSX.Element> {
  const { profile } = await getAuthUser();
  if (!profile) {
    notFound();
  }

  const canEdit = canManageCompanyResources(profile.role);
  const initialData = await listCompanyResourceCategories({ page: 1, pageSize: 50 });

  return <CategoryLibraryClient canEdit={canEdit} initialData={initialData} />;
}
