import Link from 'next/link';
import { redirect } from 'next/navigation';

import { PageContainer } from '@/components/layout/PageContainer';
import { PageTitle } from '@/components/layout/PageTitle';
import { Button } from '@/components/ui/button';
import { ProjectForm } from '@/features/projects/components/ProjectForm';
import { canCreateProject } from '@/lib/auth/permissions';
import { getAuthUser } from '@/lib/auth/session';
import { ROUTES } from '@/lib/constants/routes';

export const dynamic = 'force-dynamic';

export default async function CreateProjectPage(): Promise<React.JSX.Element> {
  const { profile } = await getAuthUser();

  if (!profile || !canCreateProject(profile.role)) {
    redirect(ROUTES.unauthorized);
  }

  return (
    <PageContainer>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <PageTitle title="Create Project" />
        <Button asChild variant="outline">
          <Link href={ROUTES.projectImport}>Smart Excel Import</Link>
        </Button>
      </div>
      <ProjectForm />
    </PageContainer>
  );
}
