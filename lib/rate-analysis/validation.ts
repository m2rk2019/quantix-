import type { RateAnalysisLineInput } from '@/types/rate-library';

export interface RateAnalysisValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateRateAnalysisLines(
  lines: RateAnalysisLineInput[],
  options?: { checkDuplicates?: boolean; duplicateIds?: string[] }
): RateAnalysisValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (lines.length === 0) {
    errors.push('Add at least one resource line before saving.');
  }

  for (const [index, line] of lines.entries()) {
    const row = index + 1;

    if (!line.resource_name?.trim()) {
      errors.push(`Row ${row}: resource name is required.`);
    }

    if (!line.unit?.trim()) {
      errors.push(`Row ${row}: unit is required.`);
    }

    if (line.consumption < 0) {
      errors.push(`Row ${row}: quantity cannot be negative.`);
    }

    if (line.unit_cost < 0) {
      errors.push(`Row ${row}: unit rate cannot be negative.`);
    }

    const waste = line.waste_percent ?? 0;
    if (waste < 0 || waste > 100) {
      errors.push(`Row ${row}: waste % must be between 0 and 100.`);
    }

    if (
      line.productivity !== null &&
      line.productivity !== undefined &&
      line.productivity <= 0
    ) {
      errors.push(`Row ${row}: productivity must be greater than 0 when set.`);
    }
  }

  if (options?.checkDuplicates && options.duplicateIds?.length) {
    warnings.push(
      `${options.duplicateIds.length} duplicate library resource(s) detected in the same category.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
