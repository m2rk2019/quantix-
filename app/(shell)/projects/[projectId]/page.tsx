import { notFound } from 'next/navigation';

import { SaveAsMasterTemplateButton } from '@/features/master-templates/components/SaveAsMasterTemplateButton';
import { TemplateReuseImportPanel } from '@/features/master-templates/components/TemplateReuseImportPanel';
import { ProjectDetailsForm } from '@/features/projects/components/ProjectDetailsForm';
import { ProjectSummaryCards } from '@/features/projects/components/ProjectSummaryCards';
import { canCreateProject } from '@/lib/auth/permissions';
import { getAuthUser } from '@/lib/auth/session';
import type { TemplateReuseReport } from '@/lib/master-templates/compare-boq-to-template';
import { getProjectDetails } from '@/services/projects/get-project-details';
import { canEditProjectMetadata } from '@/types/project';

export const dynamic = 'force-dynamic';

interface ProjectDetailsPageProps {
  params: Promise<{ projectId: string }>;
}

function parseReuseReport(
  value: Record<string, unknown> | null
): TemplateReuseReport | null {
  if (!value) return null;
  if (
    typeof value.total_imported_items !== 'number' ||
    typeof value.percentage_boq_automatically_reused !== 'number'
  ) {
    return null;
  }
  return value as unknown as TemplateReuseReport;
}

export default async function ProjectDetailsPage({
  params,
}: ProjectDetailsPageProps): Promise<React.JSX.Element> {
  const { projectId } = await params;
  const { profile } = await getAuthUser();

  if (!profile) {
    notFound();
  }

  const project = await getProjectDetails(projectId);

  if (!project) {
    notFound();
  }

  const isOwner = project.created_by === profile.id;
  const canEdit = canEditProjectMetadata(
    profile.role,
    project.status,
    isOwner
  );
  const canManageTemplates = canCreateProject(profile.role);

  return (
    <>
      <div className="mb-4 flex flex-col items-end gap-2">
        <SaveAsMasterTemplateButton
          projectId={project.id}
          defaultName={project.project_name}
          canManage={canManageTemplates}
          projectStatus={project.status}
        />
      </div>

      <ProjectSummaryCards
        wbsNodeCount={project.wbs_node_count}
        boqItemCount={project.boq_item_count}
        grandTotal={project.grand_total}
        currency={project.currency}
      />

      {project.source_master_template_id ? (
        <div className="mb-6 space-y-2">
          <p className="text-sm text-muted-foreground">
            Source template:{' '}
            <span className="font-medium text-foreground">
              {project.source_master_template_name ?? 'Master Template'}
              {project.source_master_template_version
                ? ` v${project.source_master_template_version}`
                : ''}
            </span>
            <span className="text-xs"> (pinned — new template versions do not change this project)</span>
          </p>
          <TemplateReuseImportPanel
            projectId={project.id}
            templateName={
              project.source_master_template_name
                ? `${project.source_master_template_name}${
                    project.source_master_template_version
                      ? ` v${project.source_master_template_version}`
                      : ''
                  }`
                : 'Master Template'
            }
            canImport={canManageTemplates && canEdit}
            initialReport={parseReuseReport(project.template_reuse_report)}
          />
        </div>
      ) : null}

      <ProjectDetailsForm
        key={project.updated_at}
        project={project}
        canEdit={canEdit}
      />
    </>
  );
}
