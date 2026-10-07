import { notFound } from 'next/navigation';

import { PageTitle } from '@/components/layout/PageTitle';
import { WbsModule } from '@/features/wbs/components/WbsModule';
import { getAuthUser } from '@/lib/auth/session';
import { getProjectById } from '@/services/projects/list-projects';
import { listWbsNodes } from '@/services/wbs/list-wbs-nodes';
import { canEditWbs } from '@/types/wbs';

export const dynamic = 'force-dynamic';

interface ProjectWbsPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectWbsPage({
  params,
}: ProjectWbsPageProps): Promise<React.JSX.Element> {
  const { projectId } = await params;
  const { profile } = await getAuthUser();

  if (!profile) {
    notFound();
  }

  const project = await getProjectById(projectId);

  if (!project) {
    notFound();
  }

  const isOwner = project.created_by === profile.id;
  const canEdit = canEditWbs(profile.role, project.status, isOwner);
  const initialRoots = await listWbsNodes(projectId, null);

  return (
    <div>
      <PageTitle title="WBS" />
      <WbsModule
        projectId={projectId}
        canEdit={canEdit}
        initialRoots={initialRoots}
      />
    </div>
  );
}
