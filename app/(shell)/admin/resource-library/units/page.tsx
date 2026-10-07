import { notFound } from 'next/navigation';

import { UnitLibraryClient } from '@/features/resource-library/components/UnitLibraryClient';
import { getAuthUser } from '@/lib/auth/session';
import { canManageCompanyResources } from '@/lib/auth/permissions';
import { listCompanyUnits } from '@/services/resource-library/units';

export const dynamic = 'force-dynamic';

export default async function UnitLibraryPage(): Promise<React.JSX.Element> {
  const { profile } = await getAuthUser();
  if (!profile) {
    notFound();
  }

  const canEdit = canManageCompanyResources(profile.role);
  const initialData = await listCompanyUnits({ page: 1, pageSize: 50 });

  return <UnitLibraryClient canEdit={canEdit} initialData={initialData} />;
}
