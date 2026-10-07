import { notFound } from 'next/navigation';

import { PageTitle } from '@/components/layout/PageTitle';
import { BoqModule } from '@/features/boq/components/BoqModule';
import { getAuthUser } from '@/lib/auth/session';
import { BOQ_PAGE_SIZE } from '@/lib/performance/constants';
import { getCachedProjectMetadata } from '@/lib/cache/project-cache';
import { getProjectById } from '@/services/projects/list-projects';
import { loadBoqItemsAction, loadBoqTotalsAction } from '@/services/boq/boq-actions';
import { listWbsFilterOptions } from '@/services/boq/list-wbs-filter-options';
import { canEditWbs } from '@/types/wbs';

export const dynamic = 'force-dynamic';

interface ProjectBoqPageProps {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ wbsId?: string }>;
}

export default async function ProjectBoqPage({
  params,
  searchParams,
}: ProjectBoqPageProps): Promise<React.JSX.Element> {
  const { projectId } = await params;
  const { wbsId } = await searchParams;
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
  const wbsOptions = await listWbsFilterOptions(projectId);
  const initialWbsFilter =
    wbsId && wbsOptions.some((option) => option.id === wbsId) ? wbsId : 'all';
  const initialList = await loadBoqItemsAction(projectId, {
    wbsId: initialWbsFilter === 'all' ? null : initialWbsFilter,
    page: 1,
    pageSize: BOQ_PAGE_SIZE,
    sort: 'wbs_order',
    order: 'asc',
  });
  const initialTotals = await loadBoqTotalsAction(
    projectId,
    initialWbsFilter === 'all' ? null : initialWbsFilter
  );

  return (
    <div>
      <PageTitle title="BOQ" />
      <BoqModule
        projectId={projectId}
        canEdit={canEdit}
        currency={details.currency}
        wbsOptions={wbsOptions}
        initialItems={initialList.items}
        initialTotal={initialList.total}
        initialTotals={initialTotals}
        initialWbsFilter={initialWbsFilter}
      />
    </div>
  );
}
