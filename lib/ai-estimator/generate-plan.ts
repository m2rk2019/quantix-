import { computeLineAmount } from '@/lib/rate-analysis/compute';
import { roundCurrency } from '@/lib/boq/calculations';
import { generateAlternatives } from '@/lib/ai-estimator/alternatives';
import { getBoqCatalogForWbs } from '@/lib/ai-estimator/knowledge/boq-catalog';
import { ENGINEERING_WBS_TEMPLATES } from '@/lib/ai-estimator/knowledge/wbs-templates';
import {
  getEquipmentProductivity,
  getLaborProductivity,
  getMaterialConsumption,
} from '@/lib/ai-estimator/knowledge/productivity';
import { getCrewForWorkType } from '@/lib/ai-estimator/knowledge/crews';
import {
  matchCompanyResource,
  reserveLibraryItem,
} from '@/lib/ai-estimator/match-resources';
import { parseProjectDescription } from '@/lib/ai-estimator/parse-description';
import { estimateEngineeringQuantity } from '@/lib/ai-estimator/quantity-generator';
import { runScopeChecker } from '@/lib/ai-estimator/scope-checker';
import type {
  AiBoqSuggestion,
  AiEstimatePlan,
  AiExplanation,
  AiWbsSuggestion,
  BuildPlanInput,
} from '@/types/ai-estimator';
import { AI_KNOWLEDGE_VERSION } from '@/types/ai-estimator';
import type { RateLibraryCategory } from '@/types/rate-library';

function explain(
  why: string,
  formula: string,
  confidence: number,
  source: AiExplanation['source']
): AiExplanation {
  return {
    why,
    formula_or_assumption: formula,
    confidence,
    confidence_level:
      confidence >= 0.8 ? 'high' : confidence >= 0.55 ? 'medium' : 'low',
    source,
  };
}

function buildWbsSuggestions(
  parsed: ReturnType<typeof parseProjectDescription>,
  learningBoost: number
): AiWbsSuggestion[] {
  const nodes: AiWbsSuggestion[] = [];
  let sortOrder = 0;
  let tempIndex = 1;

  function walk(
    template: (typeof ENGINEERING_WBS_TEMPLATES)[number],
    parentTempId: string | null,
    level: number
  ): void {
    const tempId = `wbs-${tempIndex}`;
    tempIndex += 1;
    sortOrder += 1;

    let description = template.description;
    if (template.code === '2.3' && parsed.basement_levels === 0) {
      description = 'Basement & Retaining Works (optional — no basement in brief)';
    }
    if (template.code === '6.2' && !parsed.has_roof_deck) {
      description = 'Roof Waterproofing';
    }

    nodes.push({
      temp_id: tempId,
      parent_temp_id: parentTempId,
      wbs_code: template.code,
      description,
      level,
      sort_order: sortOrder,
      module: template.module,
      selected: true,
      explanation: explain(
        `Engineering knowledge base WBS template for ${template.module} discipline.`,
        `Module: ${template.module}; code ${template.code}; Philippine commercial sequence.`,
        Math.min(0.95, 0.85 + learningBoost),
        learningBoost > 0 ? 'learned_pattern' : 'engineering_rule'
      ),
    });

    for (const child of template.children ?? []) {
      walk(child, tempId, level + 1);
    }
  }

  for (const root of ENGINEERING_WBS_TEMPLATES) {
    walk(root, null, 1);
  }

  return nodes;
}

function buildRateLines(
  description: string,
  quantityType: AiBoqSuggestion['quantity_type'],
  libraryItems: BuildPlanInput['libraryItems'],
  usedIds: Set<string>,
  learningBoost: number,
  resourceSource: 'project' | 'company' = 'company'
): AiBoqSuggestion['rate_analysis_lines'] {
  const lines: AiBoqSuggestion['rate_analysis_lines'] = [];
  const categories: RateLibraryCategory[] = ['material', 'labor', 'equipment'];

  if (
    description.toLowerCase().includes('subcontract') ||
    description.toLowerCase().includes('package')
  ) {
    categories.push('subcontract');
  }

  const laborKey =
    quantityType === 'rebar_quantity'
      ? 'rebar_fixing'
      : quantityType === 'plastering'
        ? 'plastering'
        : quantityType === 'concrete_volume'
          ? 'concrete_place'
          : 'masonry_chb';

  const laborProd = getLaborProductivity(laborKey);
  const crew = getCrewForWorkType(laborProd.crew_key);
  const materialKey =
    quantityType === 'concrete_volume'
      ? 'concrete'
      : quantityType === 'chb_wall'
        ? 'chb_150'
        : quantityType === 'painting'
          ? 'paint_latex'
          : 'gypsum_board';
  const materialConsumption = getMaterialConsumption(materialKey);

  for (const category of categories) {
    const match = matchCompanyResource(libraryItems, category, description, usedIds);
    const libraryItem = match.item;

    let unitCost = libraryItem?.unit_cost ?? 0;
    let isAiEstimated = false;
    let consumption = 0.85;
    let waste = 0;
    let productivity: number | null = null;

    if (!libraryItem) {
      isAiEstimated = true;
      unitCost =
        category === 'material'
          ? 250
          : category === 'labor'
            ? 900
            : category === 'equipment'
              ? 3500
              : 150000;
    } else {
      reserveLibraryItem(usedIds, libraryItem.id);
    }

    if (category === 'material') {
      consumption = materialConsumption.factor;
      waste = materialConsumption.waste_percent;
    } else if (category === 'labor') {
      consumption = 1 / Math.max(laborProd.output_per_day, 1);
      productivity = 1;
    } else if (category === 'equipment') {
      consumption = 1 / Math.max(getEquipmentProductivity('concrete_pump').output_per_day, 1);
    } else if (category === 'subcontract') {
      consumption = 0.02;
    }

    const amount = computeLineAmount(consumption, unitCost, waste, productivity);
    const confidence = Math.min(
      0.98,
      (match.matched ? match.score : 0.42) + learningBoost
    );

    const isProjectItem =
      resourceSource === 'project' &&
      libraryItem !== null &&
      'source' in libraryItem &&
      (libraryItem as { source?: string }).source === 'project';

    lines.push({
      category,
      resource_name: libraryItem?.description ?? `AI Estimated ${category}`,
      library_item_id: isProjectItem
        ? ((libraryItem as { company_library_item_id?: string | null })
            .company_library_item_id ?? null)
        : (libraryItem?.id ?? null),
      project_library_item_id: isProjectItem ? libraryItem?.id ?? null : null,
      unit:
        libraryItem?.unit ??
        (category === 'labor' ? 'day' : category === 'subcontract' ? 'lot' : 'm2'),
      consumption,
      unit_cost: unitCost,
      waste_percent: waste,
      productivity,
      amount,
      is_ai_estimated: isAiEstimated,
      explanation: explain(
        libraryItem
          ? `Matched "${libraryItem.description}" from ${
              resourceSource === 'project'
                ? 'Project Resource Library'
                : 'Company Resource Library'
            } (no duplicate).`
          : 'No library match; AI estimated rate flagged for estimator review.',
        category === 'labor' && crew
          ? `Crew: ${crew.label} (${crew.members.map((m) => `${m.count}×${m.role}`).join(', ')})`
          : `consumption × unit_cost; waste ${waste}%`,
        confidence,
        libraryItem
          ? resourceSource === 'project'
            ? 'project_library'
            : 'company_library'
          : 'ai_estimated'
      ),
    });
  }

  return lines;
}

function buildBoqSuggestions(
  wbs: AiWbsSuggestion[],
  parsed: ReturnType<typeof parseProjectDescription>,
  libraryItems: BuildPlanInput['libraryItems'],
  learningBoost: number,
  quantityTypeBoosts: Record<string, number>,
  resourceSource: 'project' | 'company' = 'company'
): AiBoqSuggestion[] {
  const leafNodes = wbs.filter(
    (node) => !wbs.some((child) => child.parent_temp_id === node.temp_id)
  );
  const usedLibraryIds = new Set<string>();
  const suggestions: AiBoqSuggestion[] = [];
  let boqIndex = 1;

  for (const leaf of leafNodes) {
    const catalog = getBoqCatalogForWbs(leaf.wbs_code);

    for (const entry of catalog) {
      const typeBoost = quantityTypeBoosts[entry.quantity_type] ?? 0;
      const qtyResult = estimateEngineeringQuantity(entry.quantity_type, entry.unit, {
        parsed,
        learning_boost: learningBoost + typeBoost,
      });

      const rateLines = buildRateLines(
        entry.description,
        entry.quantity_type,
        libraryItems,
        usedLibraryIds,
        learningBoost,
        resourceSource
      );

      const rates = {
        material_rate: 0,
        labor_rate: 0,
        equipment_rate: 0,
        subcontract_rate: 0,
        other_cost_rate: 0,
      };

      for (const line of rateLines) {
        if (line.category === 'material') {
          rates.material_rate = roundCurrency(rates.material_rate + line.amount);
        } else if (line.category === 'labor') {
          rates.labor_rate = roundCurrency(rates.labor_rate + line.amount);
        } else if (line.category === 'equipment') {
          rates.equipment_rate = roundCurrency(rates.equipment_rate + line.amount);
        } else if (line.category === 'subcontract') {
          rates.subcontract_rate = roundCurrency(
            rates.subcontract_rate + line.amount
          );
        }
      }

      const total_rate = roundCurrency(
        rates.material_rate +
          rates.labor_rate +
          rates.equipment_rate +
          rates.subcontract_rate +
          rates.other_cost_rate
      );
      const total_amount = roundCurrency(qtyResult.quantity * total_rate);

      suggestions.push({
        temp_id: `boq-${boqIndex}`,
        wbs_temp_id: leaf.temp_id,
        wbs_code: leaf.wbs_code,
        wbs_description: leaf.description,
        description: entry.description,
        unit: qtyResult.unit,
        quantity: qtyResult.quantity,
        quantity_type: entry.quantity_type,
        quantity_explanation: qtyResult.explanation,
        ...rates,
        total_rate,
        total_amount,
        selected: true,
        user_edited_quantity: false,
        user_edited_rates: false,
        rate_analysis_lines: rateLines,
        explanation: explain(
          `Engineering quantity for ${entry.quantity_type} on WBS ${leaf.wbs_code}.`,
          qtyResult.explanation.formula,
          qtyResult.explanation.confidence,
          learningBoost > 0 ? 'learned_pattern' : 'engineering_rule'
        ),
      });

      boqIndex += 1;
    }
  }

  return suggestions;
}

export function generateEstimatePlan(input: BuildPlanInput): AiEstimatePlan {
  const parsed = parseProjectDescription(input.description);
  const learningBoost = input.learningBoost ?? 0;
  const quantityTypeBoosts = input.quantityTypeBoosts ?? {};

  const wbs = buildWbsSuggestions(parsed, learningBoost);
  const resourceSource = input.resourceSource ?? 'company';
  const boq = buildBoqSuggestions(
    wbs,
    parsed,
    input.libraryItems,
    learningBoost,
    quantityTypeBoosts,
    resourceSource
  );
  const alternatives = generateAlternatives(boq, input.libraryItems);

  const libraryItemsMatched = new Set(
    boq.flatMap((item) =>
      item.rate_analysis_lines
        .map(
          (line) => line.project_library_item_id ?? line.library_item_id
        )
        .filter((id): id is string => Boolean(id))
    )
  ).size;

  const plan: AiEstimatePlan = {
    project_id: input.projectId,
    description: parsed,
    wbs,
    boq,
    alternatives,
    scope_issues: [],
    library_items_used: libraryItemsMatched,
    library_items_matched: libraryItemsMatched,
    learning_boost_applied: learningBoost,
    knowledge_version: AI_KNOWLEDGE_VERSION,
    generated_at: new Date().toISOString(),
  };

  plan.scope_issues = runScopeChecker(plan);
  return plan;
}
