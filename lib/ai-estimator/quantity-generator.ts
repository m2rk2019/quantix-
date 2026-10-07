import { roundCurrency } from '@/lib/boq/calculations';
import {
  getEquipmentProductivity,
  getLaborProductivity,
  getMaterialConsumption,
} from '@/lib/ai-estimator/knowledge/productivity';
import type {
  AiQuantityExplanation,
  EngineeringQuantityType,
  ParsedProjectDescription,
} from '@/types/ai-estimator';
import { confidenceLevel } from '@/types/ai-estimator';

export interface QuantityEstimateResult {
  quantity: number;
  unit: string;
  explanation: AiQuantityExplanation;
}

interface QuantityContext {
  parsed: ParsedProjectDescription;
  learning_boost?: number;
}

function buildExplanation(
  formula: string,
  assumption: string,
  reference: string,
  baseConfidence: number,
  learningBoost = 0
): AiQuantityExplanation {
  const confidence = Math.min(0.98, baseConfidence + learningBoost);
  return {
    formula,
    engineering_assumption: assumption,
    reference_basis: reference,
    confidence,
    confidence_level: confidenceLevel(confidence),
  };
}

export function estimateEngineeringQuantity(
  quantityType: EngineeringQuantityType,
  unit: string,
  context: QuantityContext
): QuantityEstimateResult {
  const { parsed, learning_boost = 0 } = context;
  const gfa = parsed.gross_floor_area_m2;
  const storeys = parsed.storeys;
  const basement = parsed.basement_levels;
  const netFloor = roundCurrency(gfa * 0.92);
  const wallArea = roundCurrency(gfa * 2.8);
  const rebarProd = getLaborProductivity('rebar_fixing');

  switch (quantityType) {
    case 'concrete_volume': {
      const qty = roundCurrency(gfa * 0.18 * (1 + basement * 0.15));
      return {
        quantity: qty,
        unit: unit || 'm3',
        explanation: buildExplanation(
          `Concrete (m³) = GFA × 0.18 × basement factor`,
          `Reinforced frame buildings typically use 0.16–0.22 m³ concrete per m² GFA.`,
          'Philippine commercial benchmark; DPWH/ASEP structural estimating guides',
          0.82,
          learning_boost
        ),
      };
    }
    case 'rebar_quantity': {
      const qty = roundCurrency(gfa * 45);
      return {
        quantity: qty,
        unit: unit || 'kg',
        explanation: buildExplanation(
          `Rebar (kg) = GFA × 45 kg/m²`,
          `Office buildings: 40–55 kg/m² reinforcement density.`,
          `Crew productivity: ${rebarProd.output_per_day} kg/day (${rebarProd.crew_key})`,
          0.8,
          learning_boost
        ),
      };
    }
    case 'formworks': {
      const qty = roundCurrency(gfa * 1.6);
      return {
        quantity: qty,
        unit: unit || 'm2',
        explanation: buildExplanation(
          `Formwork (m²) = GFA × 1.6 contact area factor`,
          `Columns, beams, slabs combined contact area ≈ 1.4–1.8 × GFA.`,
          'Standard formwork take-off rule for cast-in-place RC frame',
          0.78,
          learning_boost
        ),
      };
    }
    case 'chb_wall': {
      const qty = roundCurrency(wallArea * 0.35);
      return {
        quantity: qty,
        unit: unit || 'm2',
        explanation: buildExplanation(
          `CHB wall (m²) = wall area × 0.35`,
          `~35% of envelope is infill masonry partitions.`,
          `Material: ${getMaterialConsumption('chb_150').factor} pcs/m² CHB 150mm`,
          0.76,
          learning_boost
        ),
      };
    }
    case 'plastering': {
      const qty = wallArea;
      return {
        quantity: qty,
        unit: unit || 'm2',
        explanation: buildExplanation(
          `Plaster (m²) = GFA × 2.8 wall/ceiling area`,
          `Interior + exterior plaster take-off from net wall surfaces.`,
          `Labor: ${getLaborProductivity('plastering').output_per_day} m²/day`,
          0.8,
          learning_boost
        ),
      };
    }
    case 'painting': {
      const qty = roundCurrency(wallArea * 1.05);
      return {
        quantity: qty,
        unit: unit || 'm2',
        explanation: buildExplanation(
          `Paint (m²) = plaster area × 1.05 (2 coats coverage)`,
          `Two-coat latex system on walls and ceilings.`,
          `Consumption: ${getMaterialConsumption('paint_latex').factor} L/m²`,
          0.79,
          learning_boost
        ),
      };
    }
    case 'ceiling': {
      const qty = roundCurrency(netFloor * 0.88);
      return {
        quantity: qty,
        unit: unit || 'm2',
        explanation: buildExplanation(
          `Ceiling (m²) = net floor × 0.88`,
          `88% of floor area receives suspended ceiling (excludes toilets/plant).`,
          `Labor: ${getLaborProductivity('ceiling_install').output_per_day} m²/day`,
          0.77,
          learning_boost
        ),
      };
    }
    case 'floor_finishes': {
      const qty = netFloor;
      return {
        quantity: qty,
        unit: unit || 'm2',
        explanation: buildExplanation(
          `Floor finish (m²) = net floor area`,
          `Ceramic tile / polished concrete on net occupiable area.`,
          `Labor: ${getLaborProductivity('floor_tile').output_per_day} m²/day`,
          0.81,
          learning_boost
        ),
      };
    }
    case 'roofing': {
      const qty = roundCurrency(gfa / storeys);
      return {
        quantity: qty,
        unit: unit || 'm2',
        explanation: buildExplanation(
          `Roofing (m²) = GFA / storeys (roof footprint)`,
          `One roof level covering typical floor plate.`,
          'Built-up roofing system benchmark',
          0.75,
          learning_boost
        ),
      };
    }
    case 'doors': {
      const qty = Math.max(4, Math.round(storeys * 8 + basement * 2));
      return {
        quantity: qty,
        unit: unit || 'nr',
        explanation: buildExplanation(
          `Doors (nr) = storeys × 8 + basement × 2`,
          `~8 doors per typical office floor plus basement access.`,
          'Architectural fixture count rule',
          0.7,
          learning_boost
        ),
      };
    }
    case 'windows': {
      const qty = roundCurrency((gfa / storeys) * 0.35);
      return {
        quantity: qty,
        unit: unit || 'm2',
        explanation: buildExplanation(
          `Glazing (m²) = floor plate × 0.35 glazing ratio`,
          `35% curtain wall / window ratio on typical office facade.`,
          'Facade engineering assumption',
          0.72,
          learning_boost
        ),
      };
    }
    case 'waterproofing': {
      const qty = roundCurrency((gfa / storeys) * 1.1 + basement * 120);
      return {
        quantity: qty,
        unit: unit || 'm2',
        explanation: buildExplanation(
          `Waterproofing (m²) = roof + basement walls`,
          `Membrane to roof deck and basement retaining surfaces.`,
          'Substructure waterproofing standard',
          0.74,
          learning_boost
        ),
      };
    }
    case 'earthworks': {
      const qty = roundCurrency(gfa * 0.35 * (1 + basement * 0.4));
      return {
        quantity: qty,
        unit: unit || 'm3',
        explanation: buildExplanation(
          `Earthworks (m³) = GFA × 0.35 × basement factor`,
          `Bulk cut/fill for foundations and basement excavation.`,
          `Equipment: ${getEquipmentProductivity('backhoe_excavation').output_per_day} m³/day backhoe`,
          0.76,
          learning_boost
        ),
      };
    }
    case 'piping': {
      const qty = roundCurrency(storeys * 120 + basement * 40);
      return {
        quantity: qty,
        unit: unit || 'm',
        explanation: buildExplanation(
          `Piping (m) = storeys × 120 + basement × 40`,
          `Vertical risers and horizontal distribution per floor.`,
          `Labor: ${getLaborProductivity('plumbing_rough').output_per_day} m/day`,
          0.73,
          learning_boost
        ),
      };
    }
    case 'cable_trays': {
      const qty = roundCurrency(storeys * 90);
      return {
        quantity: qty,
        unit: unit || 'm',
        explanation: buildExplanation(
          `Cable tray (m) = storeys × 90`,
          `Main electrical distribution trays per typical floor.`,
          'MEP coordination rule',
          0.71,
          learning_boost
        ),
      };
    }
    case 'conduits': {
      const qty = roundCurrency(storeys * 200);
      return {
        quantity: qty,
        unit: unit || 'm',
        explanation: buildExplanation(
          `Conduit (m) = storeys × 200`,
          `Branch circuit conduits for lighting and power.`,
          `Labor: ${getLaborProductivity('electrical_rough').output_per_day} m/day`,
          0.72,
          learning_boost
        ),
      };
    }
    case 'lighting': {
      const qty = Math.round(netFloor / 12);
      return {
        quantity: qty,
        unit: unit || 'nr',
        explanation: buildExplanation(
          `Lights (nr) = net floor / 12 m² per fixture`,
          `One LED downlight per 12 m² open-plan office.`,
          'Illuminance layout assumption (150 lux open office)',
          0.75,
          learning_boost
        ),
      };
    }
    case 'power_outlets': {
      const qty = Math.round(netFloor / 8);
      return {
        quantity: qty,
        unit: unit || 'nr',
        explanation: buildExplanation(
          `Outlets (nr) = net floor / 8 m²`,
          `One duplex outlet per 8 m² workstation zone.`,
          'Electrical load layout rule',
          0.74,
          learning_boost
        ),
      };
    }
    case 'hvac': {
      const qty = Math.round(netFloor / 25);
      return {
        quantity: qty,
        unit: unit || 'nr',
        explanation: buildExplanation(
          `VRF cassettes (nr) = net floor / 25 m²`,
          `One cassette per 25 m² conditioned area.`,
          'HVAC capacity rule of thumb: 120–150 W/m²',
          0.73,
          learning_boost
        ),
      };
    }
    case 'fire_protection': {
      const qty = Math.round(netFloor / 12);
      return {
        quantity: qty,
        unit: unit || 'nr',
        explanation: buildExplanation(
          `Sprinklers (nr) = net floor / 12 m² coverage`,
          `NFPA-style coverage approx. 12 m² per sprinkler head.`,
          'Fire code coverage assumption',
          0.78,
          learning_boost
        ),
      };
    }
    default: {
      const qty = roundCurrency(gfa / 12);
      return {
        quantity: qty,
        unit: unit || 'm2',
        explanation: buildExplanation(
          `Quantity = GFA / 12`,
          'Fallback engineering productivity factor.',
          'General estimating benchmark',
          0.55,
          learning_boost
        ),
      };
    }
  }
}
