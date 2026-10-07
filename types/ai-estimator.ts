import type { RateLibraryCategory, RateLibraryItem } from '@/types/rate-library';

export type AiConfidenceLevel = 'high' | 'medium' | 'low';

export type EngineeringModuleId =
  | 'structural'
  | 'architectural'
  | 'civil'
  | 'mepf'
  | 'site_development'
  | 'roads'
  | 'drainage'
  | 'water_supply'
  | 'sewer'
  | 'landscaping';

export type EngineeringQuantityType =
  | 'concrete_volume'
  | 'rebar_quantity'
  | 'formworks'
  | 'chb_wall'
  | 'plastering'
  | 'painting'
  | 'ceiling'
  | 'floor_finishes'
  | 'roofing'
  | 'doors'
  | 'windows'
  | 'waterproofing'
  | 'earthworks'
  | 'piping'
  | 'cable_trays'
  | 'conduits'
  | 'lighting'
  | 'power_outlets'
  | 'hvac'
  | 'fire_protection';

export interface AiExplanation {
  why: string;
  formula_or_assumption: string;
  confidence: number;
  confidence_level: AiConfidenceLevel;
  source:
    | 'company_library'
    | 'project_library'
    | 'ai_estimated'
    | 'engineering_rule'
    | 'learned_pattern';
}

export interface AiQuantityExplanation {
  formula: string;
  engineering_assumption: string;
  reference_basis: string;
  confidence: number;
  confidence_level: AiConfidenceLevel;
}

export interface ParsedProjectDescription {
  raw: string;
  building_type: 'office' | 'residential' | 'commercial' | 'mixed';
  storeys: number;
  basement_levels: number;
  has_roof_deck: boolean;
  gross_floor_area_m2: number;
  keywords: string[];
}

export interface AiWbsSuggestion {
  temp_id: string;
  parent_temp_id: string | null;
  wbs_code: string;
  description: string;
  level: number;
  sort_order: number;
  module: EngineeringModuleId;
  selected: boolean;
  explanation: AiExplanation;
}

export interface AiRateAnalysisLineSuggestion {
  category: RateLibraryCategory;
  resource_name: string;
  library_item_id: string | null;
  project_library_item_id: string | null;
  unit: string;
  consumption: number;
  unit_cost: number;
  waste_percent: number;
  productivity: number | null;
  amount: number;
  is_ai_estimated: boolean;
  explanation: AiExplanation;
}

export interface AiBoqSuggestion {
  temp_id: string;
  wbs_temp_id: string;
  wbs_code: string;
  wbs_description: string;
  description: string;
  unit: string;
  quantity: number;
  quantity_type: EngineeringQuantityType;
  quantity_explanation: AiQuantityExplanation;
  material_rate: number;
  labor_rate: number;
  equipment_rate: number;
  subcontract_rate: number;
  other_cost_rate: number;
  total_rate: number;
  total_amount: number;
  selected: boolean;
  user_edited_quantity: boolean;
  user_edited_rates: boolean;
  rate_analysis_lines: AiRateAnalysisLineSuggestion[];
  explanation: AiExplanation;
}

export interface AiAlternativeSuggestion {
  id: string;
  boq_temp_id: string;
  type: 'cheaper_material' | 'alternative_method' | 'value_engineering';
  title: string;
  description: string;
  potential_savings: number;
  confidence: number;
}

export interface AiScopeIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  category:
    | 'missing_work'
    | 'duplicate_boq'
    | 'empty_wbs'
    | 'incomplete_wbs'
    | 'missing_resource'
    | 'missing_discipline'
    | 'zero_quantity'
    | 'zero_rate';
  message: string;
  wbs_temp_id?: string;
  boq_temp_id?: string;
}

export interface AiEstimatePlan {
  project_id: string;
  description: ParsedProjectDescription;
  wbs: AiWbsSuggestion[];
  boq: AiBoqSuggestion[];
  alternatives: AiAlternativeSuggestion[];
  scope_issues: AiScopeIssue[];
  library_items_used: number;
  library_items_matched: number;
  learning_boost_applied: number;
  knowledge_version: string;
  generated_at: string;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ApplyAiEstimateResult {
  success: boolean;
  error?: string;
  wbs_created?: number;
  boq_created?: number;
  rate_analysis_saved?: number;
}

export interface BuildPlanInput {
  projectId: string;
  description: string;
  libraryItems: RateLibraryItem[];
  /** Prefer project library when non-empty; company is legacy fallback. */
  resourceSource?: 'project' | 'company';
  learningBoost?: number;
  quantityTypeBoosts?: Record<string, number>;
}

export function confidenceLevel(score: number): AiConfidenceLevel {
  if (score >= 0.8) {
    return 'high';
  }
  if (score >= 0.55) {
    return 'medium';
  }
  return 'low';
}

export const AI_KNOWLEDGE_VERSION = '10.0.0';
