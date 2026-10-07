import { getCachedEstimateSummary } from '@/lib/cache/project-cache';
import { toReportBranding } from '@/lib/company/branding';
import { getCompanySettings } from '@/services/company-settings/get-company-settings';
import { getProjectDetails } from '@/services/projects/get-project-details';
import type { ExcelExportData } from '@/types/export';

export async function loadExcelExportData(
  projectId: string
): Promise<ExcelExportData | null> {
  const [details, summary, company] = await Promise.all([
    getProjectDetails(projectId),
    getCachedEstimateSummary(projectId, { sync: true }),
    getCompanySettings(),
  ]);

  if (!details || !summary) {
    return null;
  }

  const exportDate = new Date().toISOString().slice(0, 10);

  return {
    project: {
      project_code: details.project_code,
      project_name: details.project_name,
      client_name: details.client_name,
      location: details.location,
      estimator_name: details.created_by_name,
      export_date: exportDate,
      currency: details.currency,
      status: details.status,
    },
    breakdown: summary.breakdown,
    percentages: summary.percentages,
    resourceTotals: summary.resource_totals,
    disciplineBreakdown: summary.discipline_breakdown,
    wbsRollup: summary.wbs_rollup,
    boqItems: [],
    branding: toReportBranding(company),
  };
}
