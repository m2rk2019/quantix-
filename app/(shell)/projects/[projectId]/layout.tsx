import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { PageContainer } from '@/components/layout/PageContainer';
import { RecentProjectTracker } from '@/components/navigation/RecentProjectTracker';
import { DeleteProjectDialog } from '@/features/projects/components/DeleteProjectDialog';
import { ProjectDetailsTabs } from '@/features/projects/components/ProjectDetailsTabs';
import { ProjectLifecycleActions } from '@/features/projects/components/ProjectLifecycleActions';
import { ProjectStatusBadge } from '@/features/projects/components/ProjectStatusBadge';
import { getAuthUser } from '@/lib/auth/session';
import { getProjectById } from '@/services/projects/list-projects';
import { canDeleteProject, canEditProjectMetadata } from '@/types/project';

interface ProjectLayoutProps {
  children: ReactNode;
  params: Promise<{ projectId: string }>;
}

export default async function ProjectLayout({
  children,
  params,
}: ProjectLayoutProps): Promise<React.JSX.Element> {
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
  const canDelete = canDeleteProject(profile.role, isOwner);
  const canEdit = canEditProjectMetadata(
    profile.role,
    project.status,
    isOwner
  );

  return (
    <PageContainer>
      <RecentProjectTracker projectId={project.id} />
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {project.project_name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="font-mono text-sm text-muted-foreground">
              {project.project_code}
            </span>
            <ProjectStatusBadge status={project.status} />
            {!canEdit && (
              <span className="text-xs text-muted-foreground">Read-only</span>
            )}
          </div>
        </div>

        <ProjectLifecycleActions
          projectId={project.id}
          status={project.status}
          role={profile.role}
          isOwner={isOwner}
        />
      </div>

      <ProjectDetailsTabs projectId={project.id} />

      {children}

      {canDelete && (
        <div className="mt-8 border-t pt-6">
          <DeleteProjectDialog
            projectId={project.id}
            projectCode={project.project_code}
          />
        </div>
      )}
    </PageContainer>
  );
}
