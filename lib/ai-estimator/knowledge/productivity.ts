/** Material consumption factors (per unit of work). */
export const MATERIAL_CONSUMPTION: Record<string, { unit: string; factor: number; waste_percent: number }> = {
  concrete: { unit: 'm3', factor: 1.05, waste_percent: 3 },
  cement_plaster: { unit: 'm2', factor: 0.012, waste_percent: 5 },
  paint_latex: { unit: 'm2', factor: 0.12, waste_percent: 5 },
  chb_150: { unit: 'm2', factor: 12.5, waste_percent: 3 },
  rebar: { unit: 'kg', factor: 1.02, waste_percent: 2 },
  gypsum_board: { unit: 'm2', factor: 1.05, waste_percent: 5 },
  ceramic_tile: { unit: 'm2', factor: 1.08, waste_percent: 5 },
  pvc_pipe: { unit: 'm', factor: 1.03, waste_percent: 2 },
};

export function getMaterialConsumption(materialKey: string): {
  unit: string;
  factor: number;
  waste_percent: number;
} {
  return (
    MATERIAL_CONSUMPTION[materialKey] ?? {
      unit: 'm2',
      factor: 1,
      waste_percent: 5,
    }
  );
}

export const LABOR_PRODUCTIVITY: Record<string, { unit: string; output_per_day: number; crew_key: string }> = {
  masonry_chb: { unit: 'm2', output_per_day: 8, crew_key: 'mason_crew' },
  plastering: { unit: 'm2', output_per_day: 18, crew_key: 'plaster_crew' },
  painting: { unit: 'm2', output_per_day: 35, crew_key: 'paint_crew' },
  rebar_fixing: { unit: 'kg', output_per_day: 450, crew_key: 'steel_crew' },
  concrete_place: { unit: 'm3', output_per_day: 25, crew_key: 'concrete_crew' },
  ceiling_install: { unit: 'm2', output_per_day: 22, crew_key: 'ceiling_crew' },
  floor_tile: { unit: 'm2', output_per_day: 15, crew_key: 'tile_crew' },
  electrical_rough: { unit: 'm', output_per_day: 80, crew_key: 'electrical_crew' },
  plumbing_rough: { unit: 'm', output_per_day: 60, crew_key: 'plumbing_crew' },
};

export const EQUIPMENT_PRODUCTIVITY: Record<string, { unit: string; output_per_day: number }> = {
  backhoe_excavation: { unit: 'm3', output_per_day: 180 },
  concrete_pump: { unit: 'm3', output_per_day: 120 },
  tower_crane: { unit: 'lift', output_per_day: 200 },
  mixer_1_bagger: { unit: 'm3', output_per_day: 12 },
};

export function getLaborProductivity(workType: string): {
  unit: string;
  output_per_day: number;
  crew_key: string;
} {
  return (
    LABOR_PRODUCTIVITY[workType] ?? {
      unit: 'm2',
      output_per_day: 20,
      crew_key: 'general_crew',
    }
  );
}

export function getEquipmentProductivity(equipmentKey: string): {
  unit: string;
  output_per_day: number;
} {
  return (
    EQUIPMENT_PRODUCTIVITY[equipmentKey] ?? {
      unit: 'm3',
      output_per_day: 50,
    }
  );
}
