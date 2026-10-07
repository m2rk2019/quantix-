/**
 * Quantix permanent BOQ matching standard.
 *
 * Deterministic, order-independent matching for template reuse and future
 * reconciliation. Never match by Excel row order alone.
 *
 * Priority:
 * 1. BOQ Item Code
 * 2. Description (normalized)
 * 3. Unit
 * 4. WBS
 * 5. Similarity fallback
 *
 * Rate reuse is allowed only when confidence >= MATCH_REUSE_CONFIDENCE_THRESHOLD.
 */

export const MATCH_REUSE_CONFIDENCE_THRESHOLD = 0.8;
/** Minimum similarity score to consider a fallback candidate at all. */
export const MATCH_SIMILARITY_FLOOR = 0.55;

export type BoqMatchMethod =
  | 'item_code'
  | 'description_unit_wbs'
  | 'description_unit'
  | 'description'
  | 'similarity'
  | 'none';

export interface BoqMatchCandidate {
  item_code: string;
  description: string;
  unit: string;
  /** Normalized WBS path segments (discipline → group → …). */
  wbs_path?: string[];
  quantity?: number;
  unit_rate?: number;
  /** Opaque id for the candidate (template or project BOQ id). */
  id?: string | null;
}

export interface BoqMatchResult {
  matched: boolean;
  confidence: number;
  method: BoqMatchMethod;
  candidate_id: string | null;
  candidate_index: number | null;
  notes: string[];
}

export function normalizeBoqText(value: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9.#/\-\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeItemCode(value: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/\.+$/g, '')
    .trim();
}

export function normalizeUnit(value: string): string {
  const u = normalizeBoqText(value || 'item');
  if (!u || u === 'ls' || u === 'lot' || u === 'l.s.' || u === 'l.s') {
    return u === 'l.s.' || u === 'l.s' ? 'ls' : u || 'item';
  }
  return u;
}

export function wbsPathKey(path: string[] | undefined): string {
  return (path ?? []).map(normalizeBoqText).filter(Boolean).join('>');
}

function tokenize(text: string): string[] {
  return normalizeBoqText(text)
    .split(' ')
    .filter((t) => t.length > 1);
}

/**
 * Dice coefficient on word tokens (0–1). Stable, order-independent similarity.
 */
export function descriptionSimilarity(a: string, b: string): number {
  const ta = new Set(tokenize(a));
  const tb = new Set(tokenize(b));
  if (ta.size === 0 && tb.size === 0) return 1;
  if (ta.size === 0 || tb.size === 0) return 0;
  let overlap = 0;
  for (const t of ta) {
    if (tb.has(t)) overlap += 1;
  }
  return (2 * overlap) / (ta.size + tb.size);
}

function wbsOverlapScore(a: string[] | undefined, b: string[] | undefined): number {
  const pa = (a ?? []).map(normalizeBoqText).filter(Boolean);
  const pb = (b ?? []).map(normalizeBoqText).filter(Boolean);
  if (pa.length === 0 || pb.length === 0) return 0;
  const setB = new Set(pb);
  let hit = 0;
  for (const seg of pa) {
    if (setB.has(seg)) hit += 1;
  }
  return hit / Math.max(pa.length, pb.length);
}

/**
 * Score how well `candidate` matches `query` without considering assignment.
 */
export function scoreBoqMatch(
  query: BoqMatchCandidate,
  candidate: BoqMatchCandidate
): BoqMatchResult {
  const qCode = normalizeItemCode(query.item_code);
  const cCode = normalizeItemCode(candidate.item_code);
  const qDesc = normalizeBoqText(query.description);
  const cDesc = normalizeBoqText(candidate.description);
  const qUnit = normalizeUnit(query.unit);
  const cUnit = normalizeUnit(candidate.unit);
  const unitSame = qUnit === cUnit;
  const descSame = qDesc.length > 0 && qDesc === cDesc;
  const codeSame =
    qCode.length > 0 &&
    cCode.length > 0 &&
    qCode === cCode &&
    !/^(item|sec|new)-\d+$/i.test(qCode);
  const wbsScore = wbsOverlapScore(query.wbs_path, candidate.wbs_path);
  const wbsStrong = wbsScore >= 0.5;
  const sim = descriptionSimilarity(query.description, candidate.description);

  const notes: string[] = [];
  let confidence = 0;
  let method: BoqMatchMethod = 'none';

  // 1) Item code (highest priority)
  if (codeSame) {
    method = 'item_code';
    if (descSame && unitSame && wbsStrong) {
      confidence = 1;
      notes.push('Item code + description + unit + WBS match.');
    } else if (descSame && unitSame) {
      confidence = 0.98;
      notes.push('Item code + description + unit match.');
    } else if (unitSame && wbsStrong) {
      confidence = 0.94;
      notes.push('Item code + unit + WBS match.');
    } else if (unitSame) {
      confidence = 0.9;
      notes.push('Item code + unit match.');
    } else if (descSame) {
      confidence = 0.88;
      notes.push('Item code + description match (unit differs).');
    } else {
      confidence = 0.84;
      notes.push('Item code match.');
    }
  } else if (descSame && unitSame && wbsStrong) {
    // 2–4) Description + unit + WBS
    method = 'description_unit_wbs';
    confidence = 0.92;
    notes.push('Normalized description + unit + WBS match.');
  } else if (descSame && unitSame) {
    method = 'description_unit';
    confidence = 0.88;
    notes.push('Normalized description + unit match.');
  } else if (descSame) {
    method = 'description';
    confidence = 0.76;
    notes.push('Normalized description match (unit/WBS weak).');
  } else if (sim >= MATCH_SIMILARITY_FLOOR) {
    // 5) Similarity fallback
    method = 'similarity';
    let base = 0.55 + (sim - MATCH_SIMILARITY_FLOOR) * 0.5; // up to ~0.775 from sim alone
    if (unitSame) base += 0.08;
    if (wbsStrong) base += 0.06;
    confidence = Math.min(0.79, Math.round(base * 1000) / 1000);
    notes.push(
      `Similarity fallback (${Math.round(sim * 100)}% tokens${unitSame ? ', unit' : ''}${wbsStrong ? ', WBS' : ''}).`
    );
  } else {
    return {
      matched: false,
      confidence: 0,
      method: 'none',
      candidate_id: null,
      candidate_index: null,
      notes: ['No deterministic match above similarity floor.'],
    };
  }

  return {
    matched: true,
    confidence,
    method,
    candidate_id: candidate.id ?? null,
    candidate_index: null,
    notes,
  };
}

export interface BoqMatchAssignment {
  query_index: number;
  candidate_index: number;
  confidence: number;
  method: BoqMatchMethod;
  notes: string[];
  /** True when confidence is high enough to reuse company/template rates. */
  rate_reuse_allowed: boolean;
}

/**
 * 1:1 greedy assignment by confidence (never by row order).
 * Highest-confidence pairs claim first; each candidate used at most once.
 */
export function assignBoqMatches(
  queries: BoqMatchCandidate[],
  candidates: BoqMatchCandidate[],
  options?: { reuseThreshold?: number; similarityFloor?: number }
): {
  assignments: Map<number, BoqMatchAssignment>;
  unmatchedQueryIndexes: number[];
  unmatchedCandidateIndexes: number[];
} {
  const reuseThreshold =
    options?.reuseThreshold ?? MATCH_REUSE_CONFIDENCE_THRESHOLD;
  const floor = options?.similarityFloor ?? MATCH_SIMILARITY_FLOOR;

  type Pair = BoqMatchAssignment;
  const pairs: Pair[] = [];

  for (let qi = 0; qi < queries.length; qi += 1) {
    for (let ci = 0; ci < candidates.length; ci += 1) {
      const scored = scoreBoqMatch(queries[qi], candidates[ci]);
      if (!scored.matched || scored.confidence < floor) continue;
      pairs.push({
        query_index: qi,
        candidate_index: ci,
        confidence: scored.confidence,
        method: scored.method,
        notes: scored.notes,
        rate_reuse_allowed: scored.confidence >= reuseThreshold,
      });
    }
  }

  pairs.sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    // Prefer stronger methods when confidence ties
    const methodRank: Record<BoqMatchMethod, number> = {
      item_code: 5,
      description_unit_wbs: 4,
      description_unit: 3,
      description: 2,
      similarity: 1,
      none: 0,
    };
    return methodRank[b.method] - methodRank[a.method];
  });

  const assignments = new Map<number, BoqMatchAssignment>();
  const usedQuery = new Set<number>();
  const usedCandidate = new Set<number>();

  for (const pair of pairs) {
    if (usedQuery.has(pair.query_index)) continue;
    if (usedCandidate.has(pair.candidate_index)) continue;
    usedQuery.add(pair.query_index);
    usedCandidate.add(pair.candidate_index);
    assignments.set(pair.query_index, pair);
  }

  const unmatchedQueryIndexes: number[] = [];
  for (let i = 0; i < queries.length; i += 1) {
    if (!usedQuery.has(i)) unmatchedQueryIndexes.push(i);
  }
  const unmatchedCandidateIndexes: number[] = [];
  for (let i = 0; i < candidates.length; i += 1) {
    if (!usedCandidate.has(i)) unmatchedCandidateIndexes.push(i);
  }

  return { assignments, unmatchedQueryIndexes, unmatchedCandidateIndexes };
}

export function buildWbsPathFromImport(input: {
  discipline?: string;
  group_path?: string[];
}): string[] {
  const path: string[] = [];
  if (input.discipline) path.push(input.discipline);
  for (const seg of input.group_path ?? []) {
    if (seg && normalizeBoqText(seg) !== normalizeBoqText(input.discipline ?? '')) {
      path.push(seg);
    }
  }
  return path;
}

export function buildWbsPathFromNodes(
  wbsId: string,
  wbsById: Map<
    string,
    { id: string; parent_id: string | null; description: string }
  >
): string[] {
  const path: string[] = [];
  let current: string | null = wbsId;
  const guard = new Set<string>();
  while (current && !guard.has(current)) {
    guard.add(current);
    const node = wbsById.get(current);
    if (!node) break;
    path.unshift(node.description);
    current = node.parent_id;
  }
  return path;
}
