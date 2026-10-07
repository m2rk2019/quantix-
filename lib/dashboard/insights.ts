import { formatCurrencyPHP } from '@/lib/format-currency';
import type {
  AiPortfolioInsight,
  PortfolioDisciplineItem,
  PortfolioKpis,
} from '@/types/dashboard';
import type { ProjectStatus } from '@/types/project';

interface InsightProjectRow {
  id: string;
  project_code: string;
  project_name: string;
  status: ProjectStatus;
  grand_total: number;
  boq_item_count: number;
  wbs_node_count: number;
  contingency_percent: number;
  zero_rate_items: number;
}

interface DuplicateRow {
  project_id: string;
  project_code: string;
  description: string;
}

export function buildPortfolioInsights(input: {
  kpis: PortfolioKpis;
  disciplineBreakdown: PortfolioDisciplineItem[];
  projects: InsightProjectRow[];
  duplicates: DuplicateRow[];
  aiConfidenceScore: number;
}): AiPortfolioInsight[] {
  const insights: AiPortfolioInsight[] = [];

  const topDiscipline = input.disciplineBreakdown[0];
  if (topDiscipline && topDiscipline.amount > 0) {
    insights.push({
      id: 'insight-highest-discipline',
      category: 'highest_discipline',
      severity: 'info',
      title: 'Highest Cost Discipline',
      message: `${topDiscipline.name} accounts for ${topDiscipline.percent.toFixed(1)}% of portfolio direct cost (${formatCurrencyPHP(topDiscipline.amount)}).`,
      metric_value: topDiscipline.percent,
    });
  }

  const thinScope = input.projects.filter(
    (project) => project.boq_item_count < 5 || project.wbs_node_count < 3
  );
  for (const project of thinScope.slice(0, 5)) {
    insights.push({
      id: `insight-missing-scope-${project.id}`,
      category: 'missing_scope',
      severity: 'warning',
      title: 'Possible Missing Scope',
      message: `${project.project_name} has only ${project.boq_item_count} BOQ items and ${project.wbs_node_count} WBS nodes.`,
      project_id: project.id,
      project_code: project.project_code,
    });
  }

  for (const duplicate of input.duplicates.slice(0, 5)) {
    insights.push({
      id: `insight-dup-${duplicate.project_id}-${duplicate.description.slice(0, 20)}`,
      category: 'duplicate_boq',
      severity: 'warning',
      title: 'Duplicate BOQ Line',
      message: `"${duplicate.description}" appears more than once in ${duplicate.project_code}.`,
      project_id: duplicate.project_id,
      project_code: duplicate.project_code,
    });
  }

  const highRisk = input.projects.filter(
    (project) =>
      project.contingency_percent >= 15 ||
      (project.grand_total > 0 && project.zero_rate_items > 0)
  );
  for (const project of highRisk.slice(0, 5)) {
    const reasons: string[] = [];
    if (project.contingency_percent >= 15) {
      reasons.push(`contingency at ${project.contingency_percent}%`);
    }
    if (project.zero_rate_items > 0) {
      reasons.push(`${project.zero_rate_items} zero-rate BOQ lines`);
    }
    insights.push({
      id: `insight-risk-${project.id}`,
      category: 'high_risk',
      severity: 'critical',
      title: 'High-Risk Estimate',
      message: `${project.project_name}: ${reasons.join('; ')}.`,
      project_id: project.id,
      project_code: project.project_code,
    });
  }

  if (input.kpis.total_estimated_value > 0) {
    const materialShare =
      input.disciplineBreakdown.find((item) =>
        item.name.toLowerCase().includes('structural')
      )?.percent ?? 0;
    if (materialShare > 30) {
      insights.push({
        id: 'insight-cost-saving-structural',
        category: 'cost_saving',
        severity: 'info',
        title: 'Cost Saving Opportunity',
        message:
          'Structural works dominate portfolio cost — review alternative formwork systems or precast options for value engineering.',
      });
    } else {
      insights.push({
        id: 'insight-cost-saving-general',
        category: 'cost_saving',
        severity: 'info',
        title: 'Cost Saving Opportunity',
        message:
          'Run AI Estimator alternatives on top-cost projects to surface cheaper materials and construction methods.',
      });
    }
  }

  insights.push({
    id: 'insight-ai-confidence',
    category: 'ai_confidence',
    severity:
      input.aiConfidenceScore >= 0.7
        ? 'info'
        : input.aiConfidenceScore >= 0.45
          ? 'warning'
          : 'critical',
    title: 'AI Confidence Score',
    message: `Portfolio AI confidence is ${(input.aiConfidenceScore * 100).toFixed(0)}% based on approved AI estimate history.`,
    metric_value: input.aiConfidenceScore,
  });

  return insights;
}

export function computeAiConfidenceScore(
  appliedCount: number,
  generatedCount: number
): number {
  if (generatedCount <= 0) {
    return appliedCount > 0 ? 0.65 : 0.5;
  }
  const acceptanceRate = appliedCount / generatedCount;
  return Math.min(0.95, Math.max(0.35, 0.4 + acceptanceRate * 0.55));
}
