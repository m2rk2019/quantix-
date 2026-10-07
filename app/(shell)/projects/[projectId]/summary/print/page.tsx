import { notFound } from 'next/navigation';

import { EstimatePrintModule } from '@/features/estimate/components/EstimatePrintModule';
import { toReportBranding } from '@/lib/company/branding';
import { getCachedEstimateSummary } from '@/lib/cache/project-cache';
import { getAuthUser } from '@/lib/auth/session';
import { getCompanySettings } from '@/services/company-settings/get-company-settings';
import { getProjectById } from '@/services/projects/list-projects';

export const dynamic = 'force-dynamic';

interface ProjectSummaryPrintPageProps {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ autoprint?: string }>;
}

export default async function ProjectSummaryPrintPage({
  params,
  searchParams,
}: ProjectSummaryPrintPageProps): Promise<React.JSX.Element> {
  const { projectId } = await params;
  const { autoprint } = await searchParams;
  const { profile } = await getAuthUser();

  if (!profile) {
    notFound();
  }

  const project = await getProjectById(projectId);

  if (!project) {
    notFound();
  }

  const summary = await getCachedEstimateSummary(projectId, { sync: false });
  const company = await getCompanySettings();

  if (!summary) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white print:bg-white">
      <EstimatePrintModule
        data={summary}
        branding={toReportBranding(company)}
        autoPrint={autoprint !== '0'}
      />
    </div>
  );
}
