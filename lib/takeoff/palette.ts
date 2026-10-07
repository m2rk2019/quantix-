/**
 * Reusable takeoff palette presets (V1.1 Phase 2).
 * Each preset assigns tool, unit, default color, and target layer name.
 */

import type { TakeoffMeasureTool } from '@/types/takeoff';

export type TakeoffPaletteGroup = 'Architectural' | 'Structural' | 'MEPF';

export interface TakeoffPalettePreset {
  key: string;
  group: TakeoffPaletteGroup;
  name: string;
  tool: TakeoffMeasureTool;
  unit: string;
  color: string;
  /** Maps to takeoff_layers.name */
  layer_name: string;
  discipline: string;
}

export const TAKEOFF_PALETTE_PRESETS: TakeoffPalettePreset[] = [
  // Architectural
  {
    key: 'arch.wall',
    group: 'Architectural',
    name: 'Wall',
    tool: 'polyline',
    unit: 'm',
    color: '#2563eb',
    layer_name: 'Architectural',
    discipline: 'Architectural',
  },
  {
    key: 'arch.floor_finish',
    group: 'Architectural',
    name: 'Floor Finish',
    tool: 'area',
    unit: 'm2',
    color: '#3b82f6',
    layer_name: 'Architectural',
    discipline: 'Architectural',
  },
  {
    key: 'arch.ceiling',
    group: 'Architectural',
    name: 'Ceiling',
    tool: 'area',
    unit: 'm2',
    color: '#60a5fa',
    layer_name: 'Architectural',
    discipline: 'Architectural',
  },
  {
    key: 'arch.paint',
    group: 'Architectural',
    name: 'Paint',
    tool: 'area',
    unit: 'm2',
    color: '#93c5fd',
    layer_name: 'Architectural',
    discipline: 'Architectural',
  },
  {
    key: 'arch.tile',
    group: 'Architectural',
    name: 'Tile',
    tool: 'area',
    unit: 'm2',
    color: '#1d4ed8',
    layer_name: 'Architectural',
    discipline: 'Architectural',
  },
  {
    key: 'arch.waterproofing',
    group: 'Architectural',
    name: 'Waterproofing',
    tool: 'area',
    unit: 'm2',
    color: '#1e40af',
    layer_name: 'Architectural',
    discipline: 'Architectural',
  },
  // Structural
  {
    key: 'str.excavation',
    group: 'Structural',
    name: 'Excavation',
    tool: 'area',
    unit: 'm3',
    color: '#b45309',
    layer_name: 'Structural',
    discipline: 'Structural',
  },
  {
    key: 'str.backfill',
    group: 'Structural',
    name: 'Backfill',
    tool: 'area',
    unit: 'm3',
    color: '#d97706',
    layer_name: 'Structural',
    discipline: 'Structural',
  },
  {
    key: 'str.footing',
    group: 'Structural',
    name: 'Footing',
    tool: 'area',
    unit: 'm3',
    color: '#dc2626',
    layer_name: 'Structural',
    discipline: 'Structural',
  },
  {
    key: 'str.slab',
    group: 'Structural',
    name: 'Slab',
    tool: 'area',
    unit: 'm2',
    color: '#ef4444',
    layer_name: 'Structural',
    discipline: 'Structural',
  },
  {
    key: 'str.beam',
    group: 'Structural',
    name: 'Beam',
    tool: 'polyline',
    unit: 'm',
    color: '#b91c1c',
    layer_name: 'Structural',
    discipline: 'Structural',
  },
  {
    key: 'str.column',
    group: 'Structural',
    name: 'Column',
    tool: 'count',
    unit: 'ea',
    color: '#991b1b',
    layer_name: 'Structural',
    discipline: 'Structural',
  },
  {
    key: 'str.formworks',
    group: 'Structural',
    name: 'Formworks',
    tool: 'area',
    unit: 'm2',
    color: '#f87171',
    layer_name: 'Structural',
    discipline: 'Structural',
  },
  {
    key: 'str.rebars',
    group: 'Structural',
    name: 'Rebars',
    tool: 'polyline',
    unit: 'kg',
    color: '#7f1d1d',
    layer_name: 'Structural',
    discipline: 'Structural',
  },
  // MEPF
  {
    key: 'mepf.pipe',
    group: 'MEPF',
    name: 'Pipe',
    tool: 'polyline',
    unit: 'm',
    color: '#0891b2',
    layer_name: 'Plumbing',
    discipline: 'MEPF',
  },
  {
    key: 'mepf.conduit',
    group: 'MEPF',
    name: 'Conduit',
    tool: 'polyline',
    unit: 'm',
    color: '#7c3aed',
    layer_name: 'Electrical',
    discipline: 'MEPF',
  },
  {
    key: 'mepf.cable',
    group: 'MEPF',
    name: 'Cable',
    tool: 'polyline',
    unit: 'm',
    color: '#8b5cf6',
    layer_name: 'Electrical',
    discipline: 'MEPF',
  },
  {
    key: 'mepf.duct',
    group: 'MEPF',
    name: 'Duct',
    tool: 'polyline',
    unit: 'm',
    color: '#ea580c',
    layer_name: 'Mechanical',
    discipline: 'MEPF',
  },
  {
    key: 'mepf.equipment',
    group: 'MEPF',
    name: 'Equipment',
    tool: 'count',
    unit: 'ea',
    color: '#c2410c',
    layer_name: 'Mechanical',
    discipline: 'MEPF',
  },
  {
    key: 'mepf.valves',
    group: 'MEPF',
    name: 'Valves',
    tool: 'count',
    unit: 'ea',
    color: '#0e7490',
    layer_name: 'Plumbing',
    discipline: 'MEPF',
  },
  {
    key: 'mepf.fixtures',
    group: 'MEPF',
    name: 'Fixtures',
    tool: 'count',
    unit: 'ea',
    color: '#0d9488',
    layer_name: 'Sanitary',
    discipline: 'MEPF',
  },
];

export const TAKEOFF_PALETTE_GROUPS: TakeoffPaletteGroup[] = [
  'Architectural',
  'Structural',
  'MEPF',
];

export const TAKEOFF_DISCIPLINES = [
  'Architectural',
  'Structural',
  'Civil',
  'MEPF',
  'Plumbing',
  'Sanitary',
  'Mechanical',
  'Electrical',
  'Fire Protection',
  'Landscaping',
  'General',
] as const;

export function presetsByGroup(
  group: TakeoffPaletteGroup
): TakeoffPalettePreset[] {
  return TAKEOFF_PALETTE_PRESETS.filter((p) => p.group === group);
}

export function findPreset(key: string): TakeoffPalettePreset | undefined {
  return TAKEOFF_PALETTE_PRESETS.find((p) => p.key === key);
}
