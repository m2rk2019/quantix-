import type { EngineeringModuleId } from '@/types/ai-estimator';

export interface CrewComposition {
  key: string;
  label: string;
  module: EngineeringModuleId;
  members: Array<{ role: string; count: number }>;
}

export const TYPICAL_CREW_COMPOSITION: CrewComposition[] = [
  {
    key: 'mason_crew',
    label: 'Masonry Crew',
    module: 'architectural',
    members: [
      { role: 'Mason', count: 2 },
      { role: 'Laborer', count: 2 },
    ],
  },
  {
    key: 'concrete_crew',
    label: 'Concrete Placement Crew',
    module: 'structural',
    members: [
      { role: 'Carpenter', count: 2 },
      { role: 'Laborer', count: 4 },
      { role: 'Steel fixer', count: 2 },
    ],
  },
  {
    key: 'steel_crew',
    label: 'Rebar Crew',
    module: 'structural',
    members: [
      { role: 'Steel fixer', count: 3 },
      { role: 'Laborer', count: 2 },
    ],
  },
  {
    key: 'electrical_crew',
    label: 'Electrical Rough-in Crew',
    module: 'mepf',
    members: [
      { role: 'Electrician', count: 2 },
      { role: 'Helper', count: 2 },
    ],
  },
  {
    key: 'plumbing_crew',
    label: 'Plumbing Crew',
    module: 'mepf',
    members: [
      { role: 'Plumber', count: 2 },
      { role: 'Helper', count: 1 },
    ],
  },
  {
    key: 'paint_crew',
    label: 'Painting Crew',
    module: 'architectural',
    members: [
      { role: 'Painter', count: 2 },
      { role: 'Helper', count: 1 },
    ],
  },
  {
    key: 'general_crew',
    label: 'General Construction Crew',
    module: 'civil',
    members: [
      { role: 'Foreman', count: 1 },
      { role: 'Laborer', count: 4 },
    ],
  },
];

export function getCrewForWorkType(crewKey: string): CrewComposition | null {
  return TYPICAL_CREW_COMPOSITION.find((crew) => crew.key === crewKey) ?? null;
}
