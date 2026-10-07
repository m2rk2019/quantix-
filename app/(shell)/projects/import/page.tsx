import { redirect } from 'next/navigation';

import { PageContainer } from '@/components/layout/PageContainer';
import { PageTitle } from '@/components/layout/PageTitle';
import { SmartImportUploadPanel } from '@/features/smart-import/components/SmartImportUploadPanel';
import { canCreateProject } from '@/lib/auth/permissions';
import { getAuthUser } from '@/lib/auth/session';
import { ROUTES } from '@/lib/constants/routes';

export const dynamic = 'force-dynamic';

export default async function SmartImportPage(): Promise<React.JSX.Element> {
  const { profile } = await getAuthUser();
  if (!profile || !canCreateProject(profile.role)) {
    redirect(ROUTES.unauthorized);
  }

  return (
    <PageContainer>
      <PageTitle title="Smart Excel Import" />
      <SmartImportUploadPanel />
    </PageContainer>
  );
}
