import { PageContainer } from '@/components/layout/PageContainer';
import { PageTitle } from '@/components/layout/PageTitle';
import { AdminNav } from '@/features/admin/components/AdminNav';
import { BenchmarkModule } from '@/features/benchmark/components/BenchmarkModule';
import { getAuthUser } from '@/lib/auth/session';
import { getAccuracyDashboard } from '@/services/benchmark/get-accuracy-dashboard';
import { getFormulaAudit } from '@/services/benchmark/get-formula-audit';
import {
  listBenchmarkProjects,
  validateHistoricalProject,
} from '@/services/benchmark/validate-historical';

export const dynamic = 'force-dynamic';

interface BenchmarksPageProps {
  searchParams: Promise<{ projectId?: string; tab?: string }>;
}

export default async function BenchmarksPage({
  searchParams,
}: BenchmarksPageProps): Promise<React.JSX.Element> {
  const params = await searchParams;
  const { profile } = await getAuthUser();

  const [dashboard, projects] = await Promise.all([
    getAccuracyDashboard(),
    listBenchmarkProjects(),
  ]);

  const selectedProjectId =
    params.projectId ?? projects[0]?.id ?? dashboard.project_results[0]?.project_id ?? null;

  const [validation, formulaAudit] = selectedProjectId
    ? await Promise.all([
        validateHistoricalProject(selectedProjectId),
        getFormulaAudit(selectedProjectId),
      ])
    : [null, null];

  return (
    <PageContainer>
      <PageTitle title="Historical Estimate Benchmark" />
      <p className="mb-4 text-sm text-muted-foreground">
        Validate the estimating engine against completed construction projects.
        {profile && ` Signed in as ${profile.full_name}.`}
      </p>
      <AdminNav />
      <BenchmarkModule
        dashboard={dashboard}
        projects={projects.length > 0 ? projects : dashboard.project_results.map((r) => ({
          id: r.project_id,
          project_code: r.project_code,
          project_name: r.project_name,
        }))}
        initialValidation={validation}
        initialFormulaAudit={formulaAudit}
        selectedProjectId={selectedProjectId}
      />
    </PageContainer>
  );
}
