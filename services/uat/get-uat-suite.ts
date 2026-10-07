import { UAT_AUTOMATED_CHECKS, UAT_SCENARIOS, getUatChecklistSummary } from '@/lib/uat/check-registry';
import { runPerformanceBenchmarks } from '@/lib/uat/performance-benchmarks';
import { getFormulaVerification, listUatProjects } from '@/services/uat/get-formula-verification';
import type { UatSuitePageData } from '@/types/uat';

export async function getUatSuite(projectId?: string | null): Promise<UatSuitePageData> {
  const projects = await listUatProjects();
  const selectedId = projectId ?? projects[0]?.id ?? null;

  const [formula_verification, performance] = await Promise.all([
    selectedId ? getFormulaVerification(selectedId) : Promise.resolve(null),
    Promise.resolve(runPerformanceBenchmarks()),
  ]);

  return {
    checklist: getUatChecklistSummary(),
    automated_checks: UAT_AUTOMATED_CHECKS,
    formula_verification,
    performance,
    scenarios: UAT_SCENARIOS,
    projects,
    selectedProjectId: selectedId,
  };
}
