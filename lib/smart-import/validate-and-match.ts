import type {
  SmartImportBoqRow,
  SmartImportResourceMatch,
  SmartImportResourceRow,
  SmartImportValidationReport,
} from '@/types/smart-import';

export function matchImportResources(input: {
  boqRows: SmartImportBoqRow[];
  resourceRows: SmartImportResourceRow[];
  companyLibrary: Array<{
    id: string;
    code: string;
    description: string;
    category: string;
    unit_cost: number;
  }>;
  projectLibrary: Array<{
    id: string;
    code: string;
    description: string;
    category: string;
    unit_cost: number;
  }>;
}): SmartImportResourceMatch[] {
  const sources = [
    ...input.resourceRows.map((row) => row.description),
    ...input.boqRows
      .filter((row) => !row.is_group_header)
      .map((row) => row.description),
  ];

  const unique = Array.from(new Set(sources.map((text) => text.trim()).filter(Boolean)));

  return unique.map((description) => {
    const projectHit = bestMatch(description, input.projectLibrary);
    if (projectHit && projectHit.score >= 0.75) {
      return {
        source_description: description,
        status: 'matched' as const,
        confidence: projectHit.score,
        matched_code: projectHit.item.code,
        matched_id: projectHit.item.id,
        matched_source: 'project' as const,
        suggested_category: projectHit.item.category,
      };
    }

    const companyHit = bestMatch(description, input.companyLibrary);
    if (companyHit && companyHit.score >= 0.75) {
      return {
        source_description: description,
        status: 'matched' as const,
        confidence: companyHit.score,
        matched_code: companyHit.item.code,
        matched_id: companyHit.item.id,
        matched_source: 'company' as const,
        suggested_category: companyHit.item.category,
      };
    }

    const aiHit = companyHit ?? projectHit;
    if (aiHit && aiHit.score >= 0.45) {
      return {
        source_description: description,
        status: 'needs_review' as const,
        confidence: aiHit.score,
        matched_code: aiHit.item.code,
        matched_id: aiHit.item.id,
        matched_source: 'ai_similar' as const,
        suggested_category: aiHit.item.category,
      };
    }

    return {
      source_description: description,
      status: 'missing' as const,
      confidence: 0,
      matched_code: null,
      matched_id: null,
      matched_source: null,
      suggested_category: guessCategory(description),
    };
  });
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function bestMatch<T extends { id: string; code: string; description: string; category: string }>(
  description: string,
  library: T[]
): { item: T; score: number } | null {
  const terms = tokenize(description);
  if (terms.length === 0 || library.length === 0) return null;

  let best: { item: T; score: number } | null = null;
  for (const item of library) {
    const hay = `${item.code} ${item.description}`.toLowerCase();
    let hits = 0;
    for (const term of terms) {
      if (hay.includes(term)) hits += 1;
    }
    const score = hits / terms.length;
    if (!best || score > best.score) {
      best = { item, score };
    }
  }
  return best;
}

function guessCategory(description: string): string {
  const hay = description.toLowerCase();
  if (/(labor|mason|carpenter|electrician|plumber)/.test(hay)) return 'labor';
  if (/(crane|excavator|mixer|equipment)/.test(hay)) return 'equipment';
  if (/(subcontract|package)/.test(hay)) return 'subcontract';
  return 'material';
}

export function buildValidationReport(input: {
  boqRows: SmartImportBoqRow[];
  wbsCount: number;
  resourceMatches: SmartImportResourceMatch[];
}): SmartImportValidationReport {
  const issues: SmartImportValidationReport['issues'] = [];
  const lineItems = input.boqRows.filter((row) => !row.is_group_header);

  const seen = new Map<string, number>();
  for (const row of lineItems) {
    if (row.quantity < 0 || row.unit_rate < 0 || row.amount < 0) {
      issues.push({
        severity: 'error',
        code: 'NEGATIVE_VALUE',
        message: `Negative value on ${row.item_number}: ${row.description}`,
        row_index: row.row_index,
      });
    }
    if (!row.unit?.trim()) {
      issues.push({
        severity: 'warning',
        code: 'INVALID_UNIT',
        message: `Missing unit on ${row.item_number}`,
        row_index: row.row_index,
      });
    }
    if (row.quantity === 0) {
      issues.push({
        severity: 'warning',
        code: 'QUANTITY_ANOMALY',
        message: `Zero quantity on ${row.item_number}`,
        row_index: row.row_index,
      });
    }
    if (row.amount > 0 && row.quantity > 0 && row.unit_rate > 0) {
      const expected = row.quantity * row.unit_rate;
      if (Math.abs(expected - row.amount) / Math.max(expected, 1) > 0.05) {
        issues.push({
          severity: 'warning',
          code: 'COST_ANOMALY',
          message: `Amount mismatch on ${row.item_number} (qty×rate ≠ amount)`,
          row_index: row.row_index,
        });
      }
    }
    const key = row.description.toLowerCase();
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }

  for (const [description, count] of seen) {
    if (count > 1) {
      issues.push({
        severity: 'info',
        code: 'DUPLICATE_RESOURCE',
        message: `Duplicate description appears ${count} times: ${description}`,
      });
    }
  }

  const missing = input.resourceMatches.filter((row) => row.status === 'missing');
  if (missing.length > 0) {
    issues.push({
      severity: 'warning',
      code: 'MISSING_RESOURCES',
      message: `${missing.length} resources need library matching.`,
    });
  }

  if (lineItems.length === 0) {
    issues.push({
      severity: 'error',
      code: 'MISSING_SCOPE',
      message: 'No BOQ line items were detected in the workbook.',
    });
  }

  const matched_count = input.resourceMatches.filter((r) => r.status === 'matched').length;
  const needs_review_count = input.resourceMatches.filter(
    (r) => r.status === 'needs_review'
  ).length;
  const missing_count = missing.length;

  return {
    issues,
    error_count: issues.filter((i) => i.severity === 'error').length,
    warning_count: issues.filter((i) => i.severity === 'warning').length,
    boq_count: lineItems.length,
    wbs_count: input.wbsCount,
    resource_count: input.resourceMatches.length,
    matched_count,
    needs_review_count,
    missing_count,
  };
}
