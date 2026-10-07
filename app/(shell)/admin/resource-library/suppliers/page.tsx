import { notFound } from 'next/navigation';

import { SupplierLibraryClient } from '@/features/resource-library/components/SupplierLibraryClient';
import { getAuthUser } from '@/lib/auth/session';
import { canManageCompanyResources } from '@/lib/auth/permissions';
import { listCompanySuppliers } from '@/services/resource-library/suppliers';

export const dynamic = 'force-dynamic';

export default async function SupplierLibraryPage(): Promise<React.JSX.Element> {
  const { profile } = await getAuthUser();
  if (!profile) {
    notFound();
  }

  const canEdit = canManageCompanyResources(profile.role);
  const initialData = await listCompanySuppliers({ page: 1, pageSize: 50 });

  return <SupplierLibraryClient canEdit={canEdit} initialData={initialData} />;
}
