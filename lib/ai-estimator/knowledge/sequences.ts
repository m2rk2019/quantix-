import type { EngineeringModuleId } from '@/types/ai-estimator';

export interface ConstructionSequenceStep {
  order: number;
  module: EngineeringModuleId;
  activity: string;
  depends_on: EngineeringModuleId[];
}

/** Standard construction sequence for vertical building projects. */
export const STANDARD_CONSTRUCTION_SEQUENCE: ConstructionSequenceStep[] = [
  {
    order: 1,
    module: 'site_development',
    activity: 'Mobilization, site establishment, surveying',
    depends_on: [],
  },
  {
    order: 2,
    module: 'civil',
    activity: 'Earthworks, excavation, sub-base',
    depends_on: ['site_development'],
  },
  {
    order: 3,
    module: 'structural',
    activity: 'Foundations, substructure concrete',
    depends_on: ['civil'],
  },
  {
    order: 4,
    module: 'structural',
    activity: 'Superstructure frame, slabs, rebar',
    depends_on: ['structural'],
  },
  {
    order: 5,
    module: 'mepf',
    activity: 'Rough-in plumbing, electrical, fire',
    depends_on: ['structural'],
  },
  {
    order: 6,
    module: 'architectural',
    activity: 'Masonry, plastering, ceilings',
    depends_on: ['structural'],
  },
  {
    order: 7,
    module: 'architectural',
    activity: 'Painting, flooring, doors/windows',
    depends_on: ['architectural'],
  },
  {
    order: 8,
    module: 'mepf',
    activity: 'HVAC, fixtures, testing & commissioning',
    depends_on: ['mepf', 'architectural'],
  },
  {
    order: 9,
    module: 'roads',
    activity: 'External roads and pavements',
    depends_on: ['civil'],
  },
  {
    order: 10,
    module: 'drainage',
    activity: 'Storm drainage and site grading',
    depends_on: ['civil'],
  },
  {
    order: 11,
    module: 'water_supply',
    activity: 'Water supply connection',
    depends_on: ['mepf'],
  },
  {
    order: 12,
    module: 'sewer',
    activity: 'Sewer connection',
    depends_on: ['mepf'],
  },
  {
    order: 13,
    module: 'landscaping',
    activity: 'Landscaping and external works completion',
    depends_on: ['roads', 'drainage'],
  },
];
