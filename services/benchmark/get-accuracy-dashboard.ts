import { ACCEPTANCE } from '@/lib/benchmark/comparison';
import {
  listBenchmarkProjects,
  validateHistoricalProject,
} from '@/services/benchmark/validate-historical';
import type {
  AccuracyDashboardData,
  BenchmarkComparisonRow,
} from '@/types/benchmark';
import { BENCHMARK_ARCHETYPE_LABELS } from '@/types/benchmark';

function average(values: number[]): number {
  if (values.length === 0) {
    return 100;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export async function getAccuracyDashboard(): Promise<AccuracyDashboardData> {
  const projects = await listBenchmarkProjects();
  const projectResults = (
    await Promise.all(projects.map((project) => validateHistoricalProject(project.id)))
  ).filter((result): result is NonNullable<typeof result> => result !== null);

  const quantity_accuracy_percent = average(
    projectResults.map((result) => result.quantity_accuracy_percent)
  );
  const rate_accuracy_percent = average(
    projectResults.map((result) => result.rate_accuracy_percent)
  );
  const cost_accuracy_percent = average(
    projectResults.map((result) => result.cost_accuracy_percent)
  );
  const formula_accuracy_percent = average(
    projectResults.map((result) => result.formula_accuracy_percent)
  );
  const calculation_consistency_percent = average(
    projectResults.map((result) => result.calculation_consistency_percent)
  );

  const overall_accuracy_percent = average([
    quantity_accuracy_percent,
    rate_accuracy_percent,
    cost_accuracy_percent,
    formula_accuracy_percent,
    calculation_consistency_percent,
  ]);

  const allRows: BenchmarkComparisonRow[] = projectResults.flatMap(
    (result) => result.rows
  );

  const largest_overruns = [...allRows]
    .filter((row) => row.cost_variance > 0)
    .sort((a, b) => b.cost_variance - a.cost_variance)
    .slice(0, 10);

  const largest_savings = [...allRows]
    .filter((row) => row.cost_variance < 0)
    .sort((a, b) => a.cost_variance - b.cost_variance)
    .slice(0, 10);

  const variance_heatmap = projectResults.map((result) => ({
    project_code: result.project_code,
    archetype: result.archetype
      ? BENCHMARK_ARCHETYPE_LABELS[result.archetype]
      : 'Unknown',
    quantity_variance_percent: average(
      result.rows.map((row) => Math.abs(row.quantity_variance_percent))
    ),
    rate_variance_percent: average(
      result.rows.map((row) => Math.abs(row.rate_variance_percent))
    ),
    cost_variance_percent: average(
      result.rows.map((row) => Math.abs(row.cost_variance_percent))
    ),
  }));

  const lessons_learned = buildLessonsLearned(projectResults);

  const meets_acceptance =
    quantity_accuracy_percent >= ACCEPTANCE.quantity_accuracy &&
    rate_accuracy_percent >= ACCEPTANCE.rate_accuracy &&
    formula_accuracy_percent >= ACCEPTANCE.formula_accuracy &&
    calculation_consistency_percent >= ACCEPTANCE.calculation_consistency;

  return {
    generated_at: new Date().toISOString(),
    overall_accuracy_percent,
    quantity_accuracy_percent,
    rate_accuracy_percent,
    cost_accuracy_percent,
    formula_accuracy_percent,
    calculation_consistency_percent,
    meets_acceptance,
    project_results: projectResults,
    largest_overruns,
    largest_savings,
    variance_heatmap,
    lessons_learned,
  };
}

function buildLessonsLearned(
  results: Awaited<ReturnType<typeof validateHistoricalProject>>[]
): string[] {
  const lessons: string[] = [];
  const valid = results.filter(Boolean) as NonNullable<
    Awaited<ReturnType<typeof validateHistoricalProject>>
  >[];

  if (valid.length === 0) {
    return ['Import or seed historical benchmark projects to begin validation.'];
  }

  const lowQty = valid.filter((r) => r.quantity_accuracy_percent < 95);
  if (lowQty.length > 0) {
    lessons.push(
      `Quantity take-off accuracy below 95% on ${lowQty.map((r) => r.project_code).join(', ')} — review measurement rules and waste factors.`
    );
  }

  const lowRate = valid.filter((r) => r.rate_accuracy_percent < 95);
  if (lowRate.length > 0) {
    lessons.push(
      `Rate library alignment below 95% on ${lowRate.map((r) => r.project_code).join(', ')} — refresh unit costs from awarded subcontractor rates.`
    );
  }

  const passed = valid.filter((r) => r.meets_acceptance);
  if (passed.length === valid.length) {
    lessons.push(
      'All benchmark projects meet acceptance criteria — estimating engine validated for pilot deployment.'
    );
  }

  for (const result of valid) {
    const topOverrun = [...result.rows]
      .sort((a, b) => b.cost_variance - a.cost_variance)[0];
    if (topOverrun && topOverrun.cost_variance > 0) {
      lessons.push(
        `${result.project_code}: largest overrun on ${topOverrun.item_code} (${topOverrun.cost_variance_percent.toFixed(1)}%) — consider updating productivity for similar future bids.`
      );
    }
  }

  return lessons.slice(0, 8);
}
