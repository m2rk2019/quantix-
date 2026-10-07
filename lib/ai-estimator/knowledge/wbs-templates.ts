import type { EngineeringModuleId } from '@/types/ai-estimator';

export interface WbsKnowledgeNode {
  code: string;
  description: string;
  module: EngineeringModuleId;
  children?: WbsKnowledgeNode[];
}

/** Typical WBS templates aligned to Philippine commercial building estimating. */
export const ENGINEERING_WBS_TEMPLATES: WbsKnowledgeNode[] = [
  {
    code: '1',
    description: 'Site Development',
    module: 'site_development',
    children: [
      { code: '1.1', description: 'Site Clearing & Grubbing', module: 'site_development' },
      { code: '1.2', description: 'Temporary Facilities & HSE', module: 'site_development' },
    ],
  },
  {
    code: '2',
    description: 'Civil & Earthworks',
    module: 'civil',
    children: [
      { code: '2.1', description: 'Bulk Excavation & Backfill', module: 'civil' },
      { code: '2.2', description: 'Substructure & Foundations', module: 'civil' },
      { code: '2.3', description: 'Basement & Retaining Works', module: 'civil' },
    ],
  },
  {
    code: '3',
    description: 'Structural Works',
    module: 'structural',
    children: [
      { code: '3.1', description: 'Concrete Frame & Slabs', module: 'structural' },
      { code: '3.2', description: 'Reinforcement & Formworks', module: 'structural' },
      { code: '3.3', description: 'Structural Steel & Metalworks', module: 'structural' },
    ],
  },
  {
    code: '4',
    description: 'Architectural Works',
    module: 'architectural',
    children: [
      { code: '4.1', description: 'Masonry & Partitions', module: 'architectural' },
      { code: '4.2', description: 'Plastering & Drywall', module: 'architectural' },
      { code: '4.3', description: 'Painting & Coatings', module: 'architectural' },
      { code: '4.4', description: 'Ceiling, Flooring & Doors/Windows', module: 'architectural' },
    ],
  },
  {
    code: '5',
    description: 'MEPF Services',
    module: 'mepf',
    children: [
      { code: '5.1', description: 'Plumbing & Sanitary', module: 'mepf' },
      { code: '5.2', description: 'Electrical, Lighting & Power', module: 'mepf' },
      { code: '5.3', description: 'HVAC & Ventilation', module: 'mepf' },
      { code: '5.4', description: 'Fire Protection', module: 'mepf' },
    ],
  },
  {
    code: '6',
    description: 'Roofing & Waterproofing',
    module: 'architectural',
    children: [
      { code: '6.1', description: 'Roofing System', module: 'architectural' },
      { code: '6.2', description: 'Waterproofing & Roof Deck', module: 'architectural' },
    ],
  },
  {
    code: '7',
    description: 'External Works',
    module: 'roads',
    children: [
      { code: '7.1', description: 'Roads & Pavements', module: 'roads' },
      { code: '7.2', description: 'Drainage & Storm Water', module: 'drainage' },
      { code: '7.3', description: 'Water Supply Connection', module: 'water_supply' },
      { code: '7.4', description: 'Sewer Connection', module: 'sewer' },
      { code: '7.5', description: 'Landscaping & External Finishes', module: 'landscaping' },
    ],
  },
];
