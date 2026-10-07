import { notFound } from 'next/navigation';

import { PageTitle } from '@/components/layout/PageTitle';
import { EstimateSummaryModule } from '@/features/estimate/components/EstimateSummaryModule';
import { toReportBranding } from '@/lib/company/branding';
import { canEditEstimateMarkups } from '@/lib/auth/permissions';
import { getCachedEstimateSummary } from '@/lib/cache/project-cache';
import { getAuthUser } from '@/lib/auth/session';
import { getCompanySettings } from '@/services/company-settings/get-company-settings';
import { getProjectById } from '@/services/projects/list-projects';
import { validateEstimate } from '@/services/validation/validate-estimate';

export const dynamic = 'force-dynamic';

interface ProjectSummaryPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectSummaryPage({
  params,
}: ProjectSummaryPageProps): Promise<React.JSX.Element> {
  const { projectId } = await params;
  const { profile } = await getAuthUser();

  if (!profile) {
    notFound();
  }

  const project = await getProjectById(projectId);

  if (!project) {
    notFound();
  }

  const summary = await getCachedEstimateSummary(projectId, { sync: true });

  if (!summary) {
    notFound();
  }

  const validation = await validateEstimate(projectId, {
    role: profile.role,
    userId: profile.id,
  });
  const company = await getCompanySettings();

  return (
    <div>
      <PageTitle title="Estimate Summary" />
      <EstimateSummaryModule
        projectId={projectId}
        projectStatus={project.status}
        canEditMarkups={canEditEstimateMarkups(profile.role)}
        initialData={summary}
        initialValidation={validation}
        branding={toReportBranding(company)}
      />
    </div>
  );
}
