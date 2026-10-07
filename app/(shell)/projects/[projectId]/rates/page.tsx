import { notFound } from 'next/navigation';

import { PageTitle } from '@/components/layout/PageTitle';
import { ProjectRateLibraryModule } from '@/features/rate-library/components/ProjectRateLibraryModule';
import { getAuthUser } from '@/lib/auth/session';
import { PROJECT_RATE_PAGE_SIZE } from '@/lib/performance/constants';
import { getCachedProjectMetadata } from '@/lib/cache/project-cache';
import { getProjectById } from '@/services/projects/list-projects';
import { listProjectRateLibrary } from '@/services/project-rate-library/list-project-rate-library';
import { listRateLibraryItems } from '@/services/rate-library/rate-library';
import { canEditWbs } from '@/types/wbs';

export const dynamic = 'force-dynamic';

interface ProjectRatesPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectRatesPage({
  params,
}: ProjectRatesPageProps): Promise<React.JSX.Element> {
  const { projectId } = await params;
  const { profile } = await getAuthUser();

  if (!profile) {
    notFound();
  }

  const project = await getProjectById(projectId);
  const details = await getCachedProjectMetadata(projectId);

  if (!project || !details) {
    notFound();
  }

  const isOwner = project.created_by === profile.id;
  const canEdit = canEditWbs(profile.role, project.status, isOwner);

  const [initialProjectData, companyList] = await Promise.all([
    listProjectRateLibrary({
      projectId,
      page: 1,
      pageSize: PROJECT_RATE_PAGE_SIZE,
      activeOnly: false,
    }),
    listRateLibraryItems({
      page: 1,
      pageSize: 1,
      activeOnly: true,
    }),
  ]);

  return (
    <div>
      <PageTitle title="Rate Library" />
      <p className="mb-4 text-sm text-muted-foreground">
        Project-owned resource rates. Import copies from the Company Resource
        Library; edits here never change the company master.
      </p>
      <ProjectRateLibraryModule
        projectId={projectId}
        canEdit={canEdit}
        currency={details.currency}
        initialProjectData={initialProjectData}
        companyResourceCount={companyList.total}
      />
    </div>
  );
}
