export type ValidationSeverity = 'passed' | 'warning' | 'error';

export type ValidationCategoryId =
  | 'project_details'
  | 'wbs'
  | 'boq'
  | 'estimate_summary';

export interface ValidationCheck {
  id: string;
  label: string;
  severity: ValidationSeverity;
  message: string;
  category: ValidationCategoryId;
  goToPath?: string;
  goToLabel?: string;
}

export interface ValidationCategorySummary {
  id: ValidationCategoryId;
  label: string;
  severity: ValidationSeverity;
  checks: ValidationCheck[];
}

export interface EstimateValidationResult {
  scorePercent: number;
  categories: ValidationCategorySummary[];
  checks: ValidationCheck[];
  hasCriticalErrors: boolean;
  hasExportPermission: boolean;
  canExport: boolean;
  exportBlockedReason?: string;
}

export const VALIDATION_CATEGORY_LABELS: Record<
  ValidationCategoryId,
  string
> = {
  project_details: 'Project Details',
  wbs: 'WBS',
  boq: 'BOQ',
  estimate_summary: 'Estimate Summary',
};
