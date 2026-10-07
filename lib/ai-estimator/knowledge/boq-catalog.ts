import type { EngineeringQuantityType } from '@/types/ai-estimator';

export interface BoqCatalogEntry {
  description: string;
  unit: string;
  quantity_type: EngineeringQuantityType;
  keywords: string[];
}

/** Typical BOQ line templates mapped to engineering quantity calculators. */
export const ENGINEERING_BOQ_CATALOG: Record<string, BoqCatalogEntry[]> = {
  '1.1': [
    {
      description: 'Site clearing and grubbing',
      unit: 'm2',
      quantity_type: 'earthworks',
      keywords: ['site', 'clearing'],
    },
  ],
  '1.2': [
    {
      description: 'Temporary facilities and site establishment',
      unit: 'lot',
      quantity_type: 'earthworks',
      keywords: ['temporary', 'facilities'],
    },
  ],
  '2.1': [
    {
      description: 'Bulk excavation to reduced level',
      unit: 'm3',
      quantity_type: 'earthworks',
      keywords: ['excavation', 'earth'],
    },
    {
      description: 'Backfilling and compaction',
      unit: 'm3',
      quantity_type: 'earthworks',
      keywords: ['backfill'],
    },
  ],
  '2.2': [
    {
      description: 'Reinforced concrete footings',
      unit: 'm3',
      quantity_type: 'concrete_volume',
      keywords: ['footing', 'concrete'],
    },
    {
      description: 'Waterproofing to substructure',
      unit: 'm2',
      quantity_type: 'waterproofing',
      keywords: ['waterproofing'],
    },
  ],
  '2.3': [
    {
      description: 'Basement retaining walls',
      unit: 'm3',
      quantity_type: 'concrete_volume',
      keywords: ['basement', 'wall'],
    },
    {
      description: 'Basement slab on grade',
      unit: 'm3',
      quantity_type: 'concrete_volume',
      keywords: ['basement', 'slab'],
    },
  ],
  '3.1': [
    {
      description: 'Reinforced concrete columns',
      unit: 'm3',
      quantity_type: 'concrete_volume',
      keywords: ['column', 'concrete'],
    },
    {
      description: 'Reinforced concrete beams',
      unit: 'm3',
      quantity_type: 'concrete_volume',
      keywords: ['beam', 'concrete'],
    },
    {
      description: 'Suspended floor slabs',
      unit: 'm3',
      quantity_type: 'concrete_volume',
      keywords: ['slab', 'concrete'],
    },
    {
      description: 'Formworks to columns and beams',
      unit: 'm2',
      quantity_type: 'formworks',
      keywords: ['formwork'],
    },
  ],
  '3.2': [
    {
      description: 'Supply and install deformed bars',
      unit: 'kg',
      quantity_type: 'rebar_quantity',
      keywords: ['rebar', 'deformed'],
    },
    {
      description: 'Welded wire mesh',
      unit: 'm2',
      quantity_type: 'rebar_quantity',
      keywords: ['mesh'],
    },
  ],
  '3.3': [
    {
      description: 'Structural steel stair and misc metals',
      unit: 'kg',
      quantity_type: 'rebar_quantity',
      keywords: ['steel'],
    },
  ],
  '4.1': [
    {
      description: '150mm CHB infill walls',
      unit: 'm2',
      quantity_type: 'chb_wall',
      keywords: ['chb', 'masonry'],
    },
    {
      description: 'Lightweight partition walls',
      unit: 'm2',
      quantity_type: 'chb_wall',
      keywords: ['partition'],
    },
  ],
  '4.2': [
    {
      description: 'Cement plaster interior 12mm',
      unit: 'm2',
      quantity_type: 'plastering',
      keywords: ['plaster'],
    },
    {
      description: 'Gypsum board partition 9mm',
      unit: 'm2',
      quantity_type: 'plastering',
      keywords: ['gypsum'],
    },
  ],
  '4.3': [
    {
      description: 'Interior latex paint two coats',
      unit: 'm2',
      quantity_type: 'painting',
      keywords: ['paint', 'interior'],
    },
    {
      description: 'Exterior elastomeric paint',
      unit: 'm2',
      quantity_type: 'painting',
      keywords: ['paint', 'exterior'],
    },
  ],
  '4.4': [
    {
      description: 'Suspended gypsum ceiling',
      unit: 'm2',
      quantity_type: 'ceiling',
      keywords: ['ceiling'],
    },
    {
      description: 'Ceramic floor tile 600x600',
      unit: 'm2',
      quantity_type: 'floor_finishes',
      keywords: ['floor', 'tile'],
    },
    {
      description: 'Aluminium windows',
      unit: 'm2',
      quantity_type: 'windows',
      keywords: ['window'],
    },
    {
      description: 'Solid core timber doors',
      unit: 'nr',
      quantity_type: 'doors',
      keywords: ['door'],
    },
  ],
  '5.1': [
    {
      description: 'Cold water distribution piping',
      unit: 'm',
      quantity_type: 'piping',
      keywords: ['pipe', 'water'],
    },
    {
      description: 'Soil, waste, and vent piping',
      unit: 'm',
      quantity_type: 'piping',
      keywords: ['sanitary'],
    },
  ],
  '5.2': [
    {
      description: 'Cable tray installation',
      unit: 'm',
      quantity_type: 'cable_trays',
      keywords: ['cable tray'],
    },
    {
      description: 'PVC conduit wiring',
      unit: 'm',
      quantity_type: 'conduits',
      keywords: ['conduit'],
    },
    {
      description: 'LED downlight 12W',
      unit: 'nr',
      quantity_type: 'lighting',
      keywords: ['light', 'downlight'],
    },
    {
      description: 'Duplex convenience outlets',
      unit: 'nr',
      quantity_type: 'power_outlets',
      keywords: ['outlet', 'power'],
    },
  ],
  '5.3': [
    {
      description: 'VRF cassettes typical floors',
      unit: 'nr',
      quantity_type: 'hvac',
      keywords: ['hvac', 'vrf'],
    },
    {
      description: 'Ductwork and insulation',
      unit: 'm',
      quantity_type: 'hvac',
      keywords: ['duct'],
    },
  ],
  '5.4': [
    {
      description: 'Sprinkler heads office areas',
      unit: 'nr',
      quantity_type: 'fire_protection',
      keywords: ['sprinkler'],
    },
    {
      description: 'Fire alarm smoke detectors',
      unit: 'nr',
      quantity_type: 'fire_protection',
      keywords: ['fire alarm'],
    },
  ],
  '6.1': [
    {
      description: 'Built-up roofing system',
      unit: 'm2',
      quantity_type: 'roofing',
      keywords: ['roof'],
    },
  ],
  '6.2': [
    {
      description: 'Roof waterproofing membrane',
      unit: 'm2',
      quantity_type: 'waterproofing',
      keywords: ['waterproofing', 'roof'],
    },
    {
      description: 'Roof deck hardscape paving',
      unit: 'm2',
      quantity_type: 'floor_finishes',
      keywords: ['roof deck'],
    },
  ],
  '7.1': [
    {
      description: 'Asphalt road pavement',
      unit: 'm2',
      quantity_type: 'earthworks',
      keywords: ['road', 'pavement'],
    },
  ],
  '7.2': [
    {
      description: 'Storm drainage piping',
      unit: 'm',
      quantity_type: 'piping',
      keywords: ['drainage'],
    },
  ],
  '7.3': [
    {
      description: 'Water supply service connection',
      unit: 'lot',
      quantity_type: 'piping',
      keywords: ['water supply'],
    },
  ],
  '7.4': [
    {
      description: 'Sewer line connection',
      unit: 'm',
      quantity_type: 'piping',
      keywords: ['sewer'],
    },
  ],
  '7.5': [
    {
      description: 'Soft landscaping and planting',
      unit: 'm2',
      quantity_type: 'earthworks',
      keywords: ['landscaping'],
    },
  ],
};

export function resolveBoqCatalogEntry(
  wbsCode: string,
  fallbackDescription: string
): BoqCatalogEntry {
  const entries = ENGINEERING_BOQ_CATALOG[wbsCode];
  if (entries?.[0]) {
    return entries[0];
  }

  return {
    description: fallbackDescription,
    unit: 'm2',
    quantity_type: 'earthworks',
    keywords: [],
  };
}

export function getBoqCatalogForWbs(wbsCode: string): BoqCatalogEntry[] {
  return (
    ENGINEERING_BOQ_CATALOG[wbsCode] ?? [
      {
        description: 'General works package',
        unit: 'lot',
        quantity_type: 'earthworks',
        keywords: [],
      },
    ]
  );
}
