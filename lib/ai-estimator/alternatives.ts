import type { AiAlternativeSuggestion, AiBoqSuggestion } from '@/types/ai-estimator';
import type { RateLibraryItem } from '@/types/rate-library';

export function generateAlternatives(
  boq: AiBoqSuggestion[],
  libraryItems: RateLibraryItem[]
): AiAlternativeSuggestion[] {
  const alternatives: AiAlternativeSuggestion[] = [];

  for (const item of boq) {
    if (!item.selected) {
      continue;
    }

    const materialLine = item.rate_analysis_lines.find(
      (line) => line.category === 'material'
    );
    const materialKey =
      materialLine?.project_library_item_id ?? materialLine?.library_item_id;
    if (materialKey) {
      const current = libraryItems.find((entry) => entry.id === materialKey);
      const cheaper = libraryItems
        .filter(
          (entry) =>
            entry.category === 'material' &&
            entry.id !== materialKey &&
            entry.unit_cost < (current?.unit_cost ?? Infinity)
        )
        .sort((a, b) => a.unit_cost - b.unit_cost)[0];

      if (cheaper && current) {
        const savings = round(
          (current.unit_cost - cheaper.unit_cost) * materialLine!.consumption
        );
        alternatives.push({
          id: `alt-mat-${item.temp_id}`,
          boq_temp_id: item.temp_id,
          type: 'cheaper_material',
          title: `Use ${cheaper.description}`,
          description: `Replace ${current.description} with ${cheaper.description} to reduce material rate.`,
          potential_savings: savings,
          confidence: 0.68,
        });
      }
    }

    if (item.quantity_type === 'concrete_volume') {
      alternatives.push({
        id: `alt-method-${item.temp_id}`,
        boq_temp_id: item.temp_id,
        type: 'alternative_method',
        title: 'Precast column option',
        description:
          'Consider precast reinforced concrete columns to reduce formwork and on-site labor duration.',
        potential_savings: round(item.total_amount * 0.08),
        confidence: 0.62,
      });
    }

    if (
      item.quantity_type === 'floor_finishes' ||
      item.description.toLowerCase().includes('tile')
    ) {
      alternatives.push({
        id: `alt-ve-${item.temp_id}`,
        boq_temp_id: item.temp_id,
        type: 'value_engineering',
        title: 'Vinyl plank instead of ceramic tile',
        description:
          'Value engineering: homogenous vinyl plank in staff areas maintains durability at lower installed cost.',
        potential_savings: round(item.total_amount * 0.15),
        confidence: 0.7,
      });
    }
  }

  return alternatives.slice(0, 12);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
