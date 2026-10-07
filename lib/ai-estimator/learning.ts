import type { ParsedProjectDescription } from '@/types/ai-estimator';

export interface LearningProfile {
  building_type: string;
  approval_count: number;
  quantity_type_counts: Record<string, number>;
}

export interface LearningBoostMap {
  global_boost: number;
  quantity_type_boosts: Record<string, number>;
}

const MAX_GLOBAL_BOOST = 0.12;
const MAX_TYPE_BOOST = 0.08;

export function computeLearningBoosts(
  profiles: LearningProfile[],
  parsed: ParsedProjectDescription
): LearningBoostMap {
  const matching = profiles.filter(
    (profile) => profile.building_type === parsed.building_type
  );

  const approvalCount = matching.reduce(
    (sum, profile) => sum + profile.approval_count,
    0
  );

  const global_boost = Math.min(
    MAX_GLOBAL_BOOST,
    approvalCount * 0.02
  );

  const quantity_type_boosts: Record<string, number> = {};
  for (const profile of matching) {
    for (const [type, count] of Object.entries(profile.quantity_type_counts)) {
      quantity_type_boosts[type] = Math.min(
        MAX_TYPE_BOOST,
        (quantity_type_boosts[type] ?? 0) + count * 0.01
      );
    }
  }

  return { global_boost, quantity_type_boosts };
}

export function parseLearningProfilesFromAudit(
  rows: Array<{ payload: Record<string, unknown> | null }>
): LearningProfile[] {
  const map = new Map<string, LearningProfile>();

  for (const row of rows) {
    const payload = row.payload;
    if (!payload || payload.approved !== true) {
      continue;
    }

    const buildingType = String(payload.building_type ?? 'commercial');
    const quantityTypes = Array.isArray(payload.quantity_types)
      ? (payload.quantity_types as string[])
      : [];

    const existing = map.get(buildingType) ?? {
      building_type: buildingType,
      approval_count: 0,
      quantity_type_counts: {},
    };

    existing.approval_count += 1;
    for (const type of quantityTypes) {
      existing.quantity_type_counts[type] =
        (existing.quantity_type_counts[type] ?? 0) + 1;
    }

    map.set(buildingType, existing);
  }

  return Array.from(map.values());
}

export function extractQuantityTypesFromPlan(boq: Array<{ quantity_type?: string }>): string[] {
  const types = new Set<string>();
  for (const item of boq) {
    if (item.quantity_type) {
      types.add(item.quantity_type);
    }
  }
  return Array.from(types);
}
