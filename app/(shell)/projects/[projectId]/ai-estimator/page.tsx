import { notFound } from 'next/navigation';

import { PageTitle } from '@/components/layout/PageTitle';
import { AiEstimatorModule } from '@/features/ai-estimator/components/AiEstimatorModule';
import { canUseAiEstimator } from '@/lib/auth/permissions';
import { getAuthUser } from '@/lib/auth/session';
import { getProjectDetails } from '@/services/projects/get-project-details';
import { getProjectById } from '@/services/projects/list-projects';
import { canEditProjectMetadata } from '@/types/project';

export const dynamic = 'force-dynamic';

interface ProjectAiEstimatorPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectAiEstimatorPage({
  params,
}: ProjectAiEstimatorPageProps): Promise<React.JSX.Element> {
  const { projectId } = await params;
  const { profile } = await getAuthUser();

  if (!profile || !canUseAiEstimator(profile.role)) {
    notFound();
  }

  const [project, details] = await Promise.all([
    getProjectById(projectId),
    getProjectDetails(projectId),
  ]);

  if (!project || !details) {
    notFound();
  }

  const isOwner = project.created_by === profile.id;
  const canEdit = canEditProjectMetadata(
    profile.role,
    project.status,
    isOwner
  );

  return (
    <div>
      <PageTitle title="AI Estimator" />
      <AiEstimatorModule
        projectId={projectId}
        projectStatus={project.status}
        canEdit={canEdit}
        currency={details.currency}
      />
    </div>
  );
}
