import type { ParsedProjectDescription } from '@/types/ai-estimator';

const STOREY_PATTERNS = [
  /(\d+)\s*[- ]?\s*storey/i,
  /(\d+)\s*[- ]?\s*story/i,
  /(\d+)\s*[- ]?\s*floor/i,
  /(\d+)f\b/i,
];

const BASEMENT_PATTERNS = [
  /(\d+)\s+basement/i,
  /(\d+)\s+basements/i,
  /(\d+)\s+level\s+basement/i,
];

export function parseProjectDescription(raw: string): ParsedProjectDescription {
  const text = raw.trim();
  const lower = text.toLowerCase();

  let storeys = 5;
  for (const pattern of STOREY_PATTERNS) {
    const match = lower.match(pattern);
    if (match) {
      storeys = Math.max(1, Number.parseInt(match[1], 10));
      break;
    }
  }

  let basement_levels = 0;
  for (const pattern of BASEMENT_PATTERNS) {
    const match = lower.match(pattern);
    if (match) {
      basement_levels = Math.max(0, Number.parseInt(match[1], 10));
      break;
    }
  }
  if (basement_levels === 0 && lower.includes('basement')) {
    basement_levels = 1;
  }

  const has_roof_deck =
    lower.includes('roof deck') || lower.includes('rooftop deck');

  let building_type: ParsedProjectDescription['building_type'] = 'commercial';
  if (lower.includes('office')) {
    building_type = 'office';
  } else if (
    lower.includes('residential') ||
    lower.includes('condo') ||
    lower.includes('apartment')
  ) {
    building_type = 'residential';
  } else if (lower.includes('mixed')) {
    building_type = 'mixed';
  }

  const floorPlate = building_type === 'office' ? 850 : 650;
  const gross_floor_area_m2 = Math.round(
    storeys * floorPlate + basement_levels * floorPlate * 0.9
  );

  const keywords = [
    building_type,
    `${storeys}-storey`,
    basement_levels > 0 ? `${basement_levels}-basement` : 'no-basement',
    has_roof_deck ? 'roof-deck' : 'no-roof-deck',
  ];

  return {
    raw: text,
    building_type,
    storeys,
    basement_levels,
    has_roof_deck,
    gross_floor_area_m2,
    keywords,
  };
}
