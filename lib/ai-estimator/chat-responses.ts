import type { AiChatMessage, AiEstimatePlan } from '@/types/ai-estimator';
import { summarizeBoqSelection } from '@/lib/ai-estimator/scope-checker';

export function createChatMessage(
  role: AiChatMessage['role'],
  content: string
): AiChatMessage {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    timestamp: new Date().toISOString(),
  };
}

export function answerEstimatorQuestion(
  question: string,
  plan: AiEstimatePlan | null
): string {
  const q = question.toLowerCase().trim();

  if (!plan) {
    return 'Generate an estimate plan first using the AI Project Wizard. I can then explain WBS, BOQ, rates, and scope findings.';
  }

  const { count, direct_cost } = summarizeBoqSelection(plan.boq);
  const errors = plan.scope_issues.filter((issue) => issue.severity === 'error');
  const aiEstimated = plan.boq
    .filter((item) => item.selected)
    .flatMap((item) => item.rate_analysis_lines)
    .filter((line) => line.is_ai_estimated).length;

  if (q.includes('wbs') || q.includes('work breakdown')) {
    const selected = plan.wbs.filter((node) => node.selected).length;
    return `The plan proposes ${selected} WBS nodes across general requirements, substructure, superstructure, architectural finishes, MEPF, and external works. Each node includes a confidence score and engineering rationale. Review the WBS tab before applying.`;
  }

  if (q.includes('boq') || q.includes('bill of quant')) {
    return `There are ${count} BOQ line suggestions totalling approximately ${direct_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })} in direct cost. Items are grouped by WBS discipline and include rate analysis build-ups.`;
  }

  if (q.includes('quantity') || q.includes('quantities') || q.includes('formula')) {
    return `Quantities use the engineering knowledge base (v${plan.knowledge_version}) with formulas for concrete, rebar, formworks, MEP, finishes, and more. Each BOQ line shows formula, engineering assumption, reference basis, and confidence. GFA for this plan: ~${plan.description.gross_floor_area_m2.toLocaleString()} m².`;
  }

  if (q.includes('alternative') || q.includes('value engineering') || q.includes('cheaper')) {
    return `The AI identified ${plan.alternatives.length} alternative(s) including cheaper materials, alternative construction methods, and value engineering options. Review the AI Alternatives panel for potential savings.`;
  }

  if (q.includes('learn') || q.includes('confidence')) {
    return plan.learning_boost_applied > 0
      ? `Learning system applied a +${Math.round(plan.learning_boost_applied * 100)}% confidence boost from ${plan.description.building_type} estimates you previously approved. Approved plans are stored in audit history.`
      : 'Approved AI estimates are logged to audit history. Future plans for the same building type receive higher confidence scores.';
  }

  if (q.includes('rate') || q.includes('cost') || q.includes('price')) {
    return `${plan.library_items_matched} project/company library resources were matched. ${aiEstimated} rate analysis line(s) use AI-estimated rates flagged for review. Project Resource Library is preferred when imported; company library is the automatic fallback.`;
  }

  if (q.includes('scope') || q.includes('missing') || q.includes('issue')) {
    if (errors.length === 0) {
      return `Scope check found ${plan.scope_issues.length} issue(s), none blocking. Review warnings for duplicate descriptions or AI-estimated rates before applying.`;
    }
    return `Scope check found ${errors.length} blocking error(s): ${errors.map((e) => e.message).join('; ')}. Resolve these before one-click apply.`;
  }

  if (q.includes('confidence') || q.includes('why') || q.includes('explain')) {
    return 'Every WBS node, BOQ line, and rate analysis resource includes: (1) why it was suggested, (2) formula or assumption, and (3) confidence score 0–1. Expand any suggestion card in the review panels for details.';
  }

  if (q.includes('apply') || q.includes('save') || q.includes('create')) {
    return 'Use "Apply to Project" after reviewing WBS and BOQ selections. This creates WBS nodes, BOQ items, and rate analysis lines using existing Quantix services — nothing is saved until you confirm.';
  }

  if (q.includes('basement') || q.includes('parking')) {
    return `The brief was parsed as ${plan.description.basement_levels} basement level(s) and ${plan.description.storeys} upper storeys. Basement WBS and substructure quantities are scaled accordingly.`;
  }

  if (q.includes('roof')) {
    return plan.description.has_roof_deck
      ? 'Roof deck works are included under External & Roof Works (hardscape, waterproofing).'
      : 'No roof deck was detected in the brief; roofing scope uses standard built-up roof items.';
  }

  return `I can help explain this ${plan.description.building_type} estimate (${count} BOQ items, GFA ~${plan.description.gross_floor_area_m2.toLocaleString()} m²). Ask about WBS structure, quantities, rates, scope issues, or how to apply the plan.`;
}
