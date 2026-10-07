import type { EngineeringModuleId } from '@/types/ai-estimator';

export interface EngineeringModuleDefinition {
  id: EngineeringModuleId;
  label: string;
  description: string;
  typical_sequence_order: number;
}

export const ENGINEERING_MODULES: EngineeringModuleDefinition[] = [
  {
    id: 'structural',
    label: 'Structural',
    description: 'Foundations, frame, slabs, reinforcement',
    typical_sequence_order: 2,
  },
  {
    id: 'architectural',
    label: 'Architectural',
    description: 'Masonry, finishes, doors, windows, ceilings',
    typical_sequence_order: 4,
  },
  {
    id: 'civil',
    label: 'Civil',
    description: 'Earthworks, substructure, retaining works',
    typical_sequence_order: 1,
  },
  {
    id: 'mepf',
    label: 'MEPF',
    description: 'Mechanical, electrical, plumbing, fire protection',
    typical_sequence_order: 5,
  },
  {
    id: 'site_development',
    label: 'Site Development',
    description: 'Site prep, grading, utilities coordination',
    typical_sequence_order: 0,
  },
  {
    id: 'roads',
    label: 'Roads',
    description: 'Access roads, pavements, markings',
    typical_sequence_order: 6,
  },
  {
    id: 'drainage',
    label: 'Drainage',
    description: 'Storm water, catch basins, culverts',
    typical_sequence_order: 7,
  },
  {
    id: 'water_supply',
    label: 'Water Supply',
    description: 'Domestic water distribution and storage',
    typical_sequence_order: 8,
  },
  {
    id: 'sewer',
    label: 'Sewer',
    description: 'Sanitary sewer lines and manholes',
    typical_sequence_order: 9,
  },
  {
    id: 'landscaping',
    label: 'Landscaping',
    description: 'Softscape, hardscape, irrigation',
    typical_sequence_order: 10,
  },
];

export const REQUIRED_DISCIPLINES = [
  'structural',
  'architectural',
  'mepf',
  'civil',
] as const;

export function getModuleLabel(id: EngineeringModuleId): string {
  return ENGINEERING_MODULES.find((module) => module.id === id)?.label ?? id;
}
