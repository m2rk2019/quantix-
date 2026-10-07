import { Suspense } from 'react';

import { PageContainer } from '@/components/layout/PageContainer';
import { PageTitle } from '@/components/layout/PageTitle';
import { Pagination } from '@/components/ui/pagination';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ProjectListTable } from '@/features/projects/components/ProjectListTable';
import { ProjectsToolbar } from '@/features/projects/components/ProjectsToolbar';
import { canCreateProject } from '@/lib/auth/permissions';
import { getAuthUser } from '@/lib/auth/session';
import { ROUTES } from '@/lib/constants/routes';
import { listProjects } from '@/services/projects/list-projects';
import { isProjectStatus } from '@/types/project';

export const dynamic = 'force-dynamic';

interface ProjectsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    sort?: string;
    order?: string;
  }>;
}

export default async function ProjectsPage({
  searchParams,
}: ProjectsPageProps): Promise<React.JSX.Element> {
  const params = await searchParams;
  const { profile } = await getAuthUser();

  const page = Number(params.page ?? '1') || 1;
  const search = params.search ?? '';
  const statusParam = params.status ?? '';
  const status = isProjectStatus(statusParam) ? statusParam : undefined;
  const sort = (params.sort ?? 'updated_at') as
    | 'project_code'
    | 'project_name'
    | 'client_name'
    | 'status'
    | 'updated_at';
  const order = params.order === 'asc' ? 'asc' : 'desc';

  const result = await listProjects({
    page,
    search,
    status: status ? [status] : undefined,
    sort,
    order,
  });

  const showCreateButton = profile ? canCreateProject(profile.role) : false;

  return (
    <PageContainer>
      <PageTitle title="Projects" />

      <Suspense fallback={<LoadingSpinner label="Loading filters" />}>
        <ProjectsToolbar
          initialSearch={search}
          initialStatus={status}
          initialSort={sort}
          initialOrder={order}
          showCreateButton={showCreateButton}
        />
      </Suspense>

      <ProjectListTable projects={result.projects} />

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        baseUrl={ROUTES.projects}
        searchParams={{
          search: search || undefined,
          status,
          sort,
          order,
        }}
      />
    </PageContainer>
  );
}
