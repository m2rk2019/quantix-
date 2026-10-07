import { Suspense } from 'react';

import { PageContainer } from '@/components/layout/PageContainer';
import { PageTitle } from '@/components/layout/PageTitle';
import { Pagination } from '@/components/ui/pagination';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { HistoricalProjectsTable } from '@/features/historical-projects/components/HistoricalProjectsTable';
import { HistoricalProjectsToolbar } from '@/features/historical-projects/components/HistoricalProjectsToolbar';
import { isAdminOrAbove } from '@/lib/auth/permissions';
import { getAuthUser } from '@/lib/auth/session';
import { ROUTES } from '@/lib/constants/routes';
import { listHistoricalProjects } from '@/services/historical-projects/list-historical-projects';

export const dynamic = 'force-dynamic';

interface HistoricalProjectsPageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
    project_name?: string;
    client?: string;
    location?: string;
    building_type?: string;
    discipline?: string;
    resource?: string;
    supplier?: string;
    date_from?: string;
    date_to?: string;
  }>;
}

export default async function HistoricalProjectsPage({
  searchParams,
}: HistoricalProjectsPageProps): Promise<React.JSX.Element> {
  const params = await searchParams;
  const { profile } = await getAuthUser();
  const page = Number(params.page ?? '1') || 1;

  const result = await listHistoricalProjects({
    page,
    q: params.q,
    project_name: params.project_name,
    client: params.client,
    location: params.location,
    building_type: params.building_type,
    discipline: params.discipline,
    resource: params.resource,
    supplier: params.supplier,
    date_from: params.date_from,
    date_to: params.date_to,
  });

  return (
    <PageContainer>
      <PageTitle title="Historical Projects" />
      <Suspense fallback={<LoadingSpinner label="Loading filters" />}>
        <HistoricalProjectsToolbar
          initial={{
            q: params.q,
            project_name: params.project_name,
            client: params.client,
            location: params.location,
            building_type: params.building_type,
            discipline: params.discipline,
            resource: params.resource,
            supplier: params.supplier,
            date_from: params.date_from,
            date_to: params.date_to,
          }}
          showSyncButton={profile ? isAdminOrAbove(profile.role) : false}
        />
      </Suspense>
      <HistoricalProjectsTable projects={result.projects} />
      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        baseUrl={ROUTES.historical}
        searchParams={{
          q: params.q,
          project_name: params.project_name,
          client: params.client,
          location: params.location,
          building_type: params.building_type,
          discipline: params.discipline,
          resource: params.resource,
          supplier: params.supplier,
          date_from: params.date_from,
          date_to: params.date_to,
        }}
      />
    </PageContainer>
  );
}
