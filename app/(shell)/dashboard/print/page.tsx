import { notFound } from 'next/navigation';

import { ExecutivePrintModule } from '@/features/dashboard/components/ExecutivePrintModule';
import { toReportBranding } from '@/lib/company/branding';
import { getAuthUser } from '@/lib/auth/session';
import { getCompanySettings } from '@/services/company-settings/get-company-settings';
import {
  getExecutiveDashboard,
  parseDashboardFilters,
} from '@/services/dashboard/get-executive-dashboard';

export const dynamic = 'force-dynamic';

interface DashboardPrintPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function DashboardPrintPage({
  searchParams,
}: DashboardPrintPageProps): Promise<React.JSX.Element> {
  const params = await searchParams;
  const { profile } = await getAuthUser();

  if (!profile) {
    notFound();
  }

  const filters = parseDashboardFilters(params);
  filters.pageSize = 500;
  const [data, company] = await Promise.all([
    getExecutiveDashboard(filters),
    getCompanySettings(),
  ]);

  return (
    <div className="min-h-screen bg-white print:bg-white">
      <ExecutivePrintModule
        data={data}
        branding={toReportBranding(company)}
        autoPrint={params.autoprint !== '0'}
      />
    </div>
  );
}
