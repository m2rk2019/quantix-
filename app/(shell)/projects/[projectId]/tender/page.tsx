import { TenderSubmissionModule } from '@/features/tender/components/TenderSubmissionModule';
import { canUseAiEstimator } from '@/lib/auth/permissions';
import { getAuthUser } from '@/lib/auth/session';
import { toReportBranding } from '@/lib/company/branding';
import { getCompanySettings } from '@/services/company-settings/get-company-settings';
import { getEstimateSummary } from '@/services/estimate/get-estimate-summary';
import { getProjectById } from '@/services/projects/list-projects';
import { loadTenderCommercialFields } from '@/services/tender/build-tender-package';
import { listTenderSubmissions } from '@/services/tender/list-tender-submissions';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface TenderPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectTenderPage({
  params,
}: TenderPageProps): Promise<React.JSX.Element> {
  const { projectId } = await params;
  const { profile } = await getAuthUser();
  const project = await getProjectById(projectId);
  if (!project) {
    notFound();
  }

  const [company, commercial, history, summary] = await Promise.all([
    getCompanySettings(),
    loadTenderCommercialFields(projectId),
    listTenderSubmissions(projectId),
    getEstimateSummary(projectId),
  ]);

  if (!summary) {
    notFound();
  }

  const brandingBase = toReportBranding(company);

  return (
    <TenderSubmissionModule
      projectId={projectId}
      branding={{
        company_name: brandingBase.companyName,
        logo_url: brandingBase.logoUrl,
        address: brandingBase.address,
        phone: brandingBase.phone,
        email: brandingBase.email,
        website: brandingBase.website,
        report_header: brandingBase.reportHeader,
        report_footer: brandingBase.reportFooter,
        prepared_by:
          commercial.prepared_by_name || summary.bid_summary.prepared_by || '',
        checked_by: commercial.checked_by_name || '',
        approved_by: commercial.approved_by_name || '',
      }}
      assumptions={commercial.assumptions}
      exclusions={commercial.exclusions}
      commercialNotes={commercial.commercial_notes}
      history={history}
      canGenerate={profile ? canUseAiEstimator(profile.role) : false}
    />
  );
}
