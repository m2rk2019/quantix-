/**
 * Build project resources + rate-analysis links for imported BOQ lines.
 */

import type { RateLibraryCategory } from '@/types/database';
import type { SmartImportBoqRow, SmartImportResourceRow } from '@/types/smart-import';

export interface LinkedResourcePlan {
  code: string;
  description: string;
  unit: string;
  unit_cost: number;
  category: RateLibraryCategory;
  source_company_item_id: string | null;
  match_confidence: number;
  match_status: 'matched' | 'needs_review' | 'created';
}

export interface BoqResourceLinkPlan {
  boq_item_number: string;
  resource_code: string;
  consumption: number;
  productivity: number | null;
  unit_cost: number;
  amount: number;
  category: RateLibraryCategory;
}

function asCategory(value: string | null | undefined): RateLibraryCategory {
  const allowed: RateLibraryCategory[] = [
    'material',
    'labor',
    'equipment',
    'subcontract',
    'service',
    'productivity',
  ];
  if (value && (allowed as string[]).includes(value)) {
    return value as RateLibraryCategory;
  }
  return 'material';
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function score(description: string, candidate: string): number {
  const terms = tokenize(description);
  if (terms.length === 0) return 0;
  const hay = candidate.toLowerCase();
  let hits = 0;
  for (const term of terms) {
    if (hay.includes(term)) hits += 1;
  }
  return hits / terms.length;
}

function sanitizeCode(raw: string, fallback: string): string {
  const cleaned = raw.replace(/[^\w.-]+/g, '-').slice(0, 50);
  return cleaned || fallback;
}

export function planBoqResourceLinks(input: {
  boqRows: SmartImportBoqRow[];
  resourceRows: SmartImportResourceRow[];
  companyLibrary: Array<{
    id: string;
    code: string;
    description: string;
    category: string;
    unit_cost: number;
  }>;
}): {
  resources: LinkedResourcePlan[];
  links: BoqResourceLinkPlan[];
} {
  const lineItems = input.boqRows.filter((row) => !row.is_group_header);
  const resources: LinkedResourcePlan[] = [];
  const links: BoqResourceLinkPlan[] = [];
  const codeSet = new Set<string>();

  // Seed from explicit resource sheet first.
  for (const row of input.resourceRows) {
    const code = sanitizeCode(row.code, `RES-${resources.length + 1}`);
    if (codeSet.has(code)) continue;
    codeSet.add(code);

    let bestCompany: (typeof input.companyLibrary)[number] | null = null;
    let bestScore = 0;
    for (const company of input.companyLibrary) {
      const s = score(row.description, `${company.code} ${company.description}`);
      if (s > bestScore) {
        bestScore = s;
        bestCompany = company;
      }
    }

    resources.push({
      code,
      description: row.description.slice(0, 500),
      unit: row.unit || 'item',
      unit_cost: Number(row.unit_cost ?? 0),
      category: asCategory(row.category),
      source_company_item_id:
        bestCompany && bestScore >= 0.75 ? bestCompany.id : null,
      match_confidence: bestScore,
      match_status:
        bestCompany && bestScore >= 0.75
          ? 'matched'
          : bestCompany && bestScore >= 0.45
            ? 'needs_review'
            : 'created',
    });
  }

  for (const [index, row] of lineItems.entries()) {
    const unitRate =
      row.unit_rate || (row.quantity > 0 ? row.amount / row.quantity : 0);
    const amount = row.amount || row.quantity * unitRate;
    const code = sanitizeCode(row.item_number, `BOQ-${index + 1}`);

    // Prefer an existing planned resource with strong description overlap.
    let resourceCode = resources.find(
      (resource) => score(row.description, resource.description) >= 0.6
    )?.code;

    if (!resourceCode) {
      let unique = code;
      let suffix = 1;
      while (codeSet.has(unique)) {
        unique = `${code}-${suffix}`.slice(0, 50);
        suffix += 1;
      }
      codeSet.add(unique);
      resourceCode = unique;

      let bestCompany: (typeof input.companyLibrary)[number] | null = null;
      let bestScore = 0;
      for (const company of input.companyLibrary) {
        const s = score(row.description, `${company.code} ${company.description}`);
        if (s > bestScore) {
          bestScore = s;
          bestCompany = company;
        }
      }

      resources.push({
        code: unique,
        description: row.description.slice(0, 500),
        unit: row.unit || 'item',
        unit_cost: unitRate,
        category: asCategory('material'),
        source_company_item_id:
          bestCompany && bestScore >= 0.75 ? bestCompany.id : null,
        match_confidence: bestScore,
        match_status:
          bestCompany && bestScore >= 0.75
            ? 'matched'
            : bestCompany && bestScore >= 0.45
              ? 'needs_review'
              : 'created',
      });
    }

    links.push({
      boq_item_number: row.item_number,
      resource_code: resourceCode,
      consumption: 1,
      productivity: null,
      unit_cost: unitRate,
      amount,
      category: asCategory('material'),
    });
  }

  return { resources, links };
}
