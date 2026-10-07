import type { AiBoqSuggestion, AiEstimatePlan, AiScopeIssue } from '@/types/ai-estimator';
import { REQUIRED_DISCIPLINES } from '@/lib/ai-estimator/knowledge/modules';

function normalizeDescription(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

const DISCIPLINE_KEYWORDS: Record<string, string[]> = {
  structural: ['structural', 'concrete', 'rebar', 'frame'],
  architectural: ['architectural', 'masonry', 'plaster', 'paint', 'ceiling'],
  civil: ['civil', 'earth', 'excavat', 'foundation', 'substructure'],
  mepf: ['mepf', 'plumbing', 'electrical', 'hvac', 'fire'],
};

export function runScopeChecker(plan: AiEstimatePlan): AiScopeIssue[] {
  const issues: AiScopeIssue[] = [];
  const selectedWbs = plan.wbs.filter((node) => node.selected);
  const selectedBoq = plan.boq.filter((item) => item.selected);

  const selectedModules = new Set(selectedWbs.map((node) => node.module));

  for (const discipline of REQUIRED_DISCIPLINES) {
    if (!selectedModules.has(discipline)) {
      issues.push({
        id: `missing-discipline-${discipline}`,
        severity: 'warning',
        category: 'missing_discipline',
        message: `Missing discipline module: ${discipline}.`,
      });
    }
  }

  const rootNodes = selectedWbs.filter((node) => !node.parent_temp_id);
  if (rootNodes.length < 5) {
    issues.push({
      id: 'incomplete-wbs-roots',
      severity: 'warning',
      category: 'incomplete_wbs',
      message: `WBS appears incomplete (${rootNodes.length} root sections; expected ≥5).`,
    });
  }

  const leafWbs = selectedWbs.filter(
    (node) => !selectedWbs.some((child) => child.parent_temp_id === node.temp_id)
  );

  for (const leaf of leafWbs) {
    const items = selectedBoq.filter((item) => item.wbs_temp_id === leaf.temp_id);
    if (items.length === 0) {
      issues.push({
        id: `empty-wbs-${leaf.temp_id}`,
        severity: 'error',
        category: 'empty_wbs',
        message: `WBS ${leaf.wbs_code} "${leaf.description}" has no BOQ items.`,
        wbs_temp_id: leaf.temp_id,
      });
    }
  }

  const descriptionCounts = new Map<string, string[]>();
  for (const item of selectedBoq) {
    const key = `${item.wbs_temp_id}:${normalizeDescription(item.description)}`;
    const list = descriptionCounts.get(key) ?? [];
    list.push(item.temp_id);
    descriptionCounts.set(key, list);
  }

  for (const [key, ids] of descriptionCounts) {
    if (ids.length > 1) {
      issues.push({
        id: `dup-${key}`,
        severity: 'warning',
        category: 'duplicate_boq',
        message: `Duplicate BOQ description detected (${ids.length} items).`,
        boq_temp_id: ids[0],
      });
    }
  }

  for (const [discipline, keywords] of Object.entries(DISCIPLINE_KEYWORDS)) {
    const hasWbs = selectedWbs.some((node) =>
      keywords.some((keyword) => node.description.toLowerCase().includes(keyword))
    );
    const hasBoq = selectedBoq.some((item) =>
      keywords.some((keyword) => item.description.toLowerCase().includes(keyword))
    );

    if (!hasWbs && !hasBoq) {
      issues.push({
        id: `missing-work-${discipline}`,
        severity: 'warning',
        category: 'missing_work',
        message: `Possible missing work package for ${discipline}.`,
      });
    }
  }

  for (const item of selectedBoq) {
    if (item.quantity <= 0 && !item.user_edited_quantity) {
      issues.push({
        id: `zero-qty-${item.temp_id}`,
        severity: 'error',
        category: 'zero_quantity',
        message: `${item.description} has zero quantity.`,
        boq_temp_id: item.temp_id,
      });
    }

    if (item.total_rate <= 0) {
      issues.push({
        id: `zero-rate-${item.temp_id}`,
        severity: 'error',
        category: 'zero_rate',
        message: `${item.description} has zero total rate.`,
        boq_temp_id: item.temp_id,
      });
    }

    for (const line of item.rate_analysis_lines) {
      if (!line.library_item_id && !line.project_library_item_id && line.is_ai_estimated) {
        issues.push({
          id: `missing-res-${item.temp_id}-${line.category}`,
          severity: 'info',
          category: 'missing_resource',
          message: `${item.description}: ${line.category} uses AI-estimated rate (no library match).`,
          boq_temp_id: item.temp_id,
        });
      }
    }
  }

  return issues;
}

export function hasBlockingScopeIssues(issues: AiScopeIssue[]): boolean {
  return issues.some((issue) => issue.severity === 'error');
}

export function summarizeBoqSelection(boq: AiBoqSuggestion[]): {
  count: number;
  direct_cost: number;
} {
  const selected = boq.filter((item) => item.selected);
  return {
    count: selected.length,
    direct_cost: selected.reduce((sum, item) => sum + item.total_amount, 0),
  };
}
