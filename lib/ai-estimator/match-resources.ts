import type { ProjectAwareLibraryItem } from '@/types/project-aware-resource';
import type { RateLibraryCategory, RateLibraryItem } from '@/types/rate-library';

export interface ResourceMatchResult {
  item: (RateLibraryItem | ProjectAwareLibraryItem) | null;
  matched: boolean;
  score: number;
  searchTerms: string[];
}

const CATEGORY_KEYWORDS: Record<RateLibraryCategory, string[]> = {
  material: ['cement', 'concrete', 'steel', 'rebar', 'paint', 'pipe', 'tile', 'gypsum', 'block'],
  labor: ['mason', 'carpenter', 'electrician', 'plumber', 'laborer', 'painter', 'steel fixer'],
  equipment: ['mixer', 'crane', 'backhoe', 'scaffold', 'pump', 'excavator'],
  subcontract: ['subcontract', 'specialist', 'package', 'fire protection', 'electrical'],
  service: ['service', 'consulting', 'testing', 'inspection', 'survey'],
  productivity: ['productivity', 'output', 'crew', 'gang', 'production rate'],
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function scoreMatch(
  libraryItem: RateLibraryItem,
  searchTerms: string[],
  category: RateLibraryCategory
): number {
  if (libraryItem.category !== category) {
    return 0;
  }

  const haystack = `${libraryItem.code} ${libraryItem.description}`.toLowerCase();
  let score = 0;

  for (const term of searchTerms) {
    if (haystack.includes(term)) {
      score += term.length >= 5 ? 3 : 2;
    }
  }

  for (const keyword of CATEGORY_KEYWORDS[category]) {
    if (searchTerms.some((term) => term.includes(keyword) || keyword.includes(term))) {
      if (haystack.includes(keyword)) {
        score += 1;
      }
    }
  }

  return score;
}

export function matchCompanyResource(
  libraryItems: RateLibraryItem[],
  category: RateLibraryCategory,
  contextText: string,
  usedLibraryIds: Set<string>
): ResourceMatchResult {
  const searchTerms = tokenize(contextText);
  let best: RateLibraryItem | null = null;
  let bestScore = 0;

  for (const item of libraryItems) {
    if (usedLibraryIds.has(item.id)) {
      continue;
    }

    const score = scoreMatch(item, searchTerms, category);
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  if (!best || bestScore < 2) {
    const categoryFallback = libraryItems.find(
      (item) => item.category === category && !usedLibraryIds.has(item.id)
    );
    if (categoryFallback) {
      return {
        item: categoryFallback,
        matched: false,
        score: 0.45,
        searchTerms,
      };
    }
    return { item: null, matched: false, score: 0, searchTerms };
  }

  return {
    item: best,
    matched: true,
    score: Math.min(0.98, 0.55 + bestScore * 0.08),
    searchTerms,
  };
}

export function reserveLibraryItem(
  usedLibraryIds: Set<string>,
  libraryItemId: string | null
): void {
  if (libraryItemId) {
    usedLibraryIds.add(libraryItemId);
  }
}
