/**
 * Takeoff summary aggregations for the bottom summary bar.
 */

import type { TakeoffLayer, TakeoffMeasurement } from '@/types/takeoff';

export interface TakeoffSummaryRow {
  key: string;
  label: string;
  count: number;
  length_m: number;
  area_m2: number;
  count_value: number;
}

function emptyRow(key: string, label: string): TakeoffSummaryRow {
  return { key, label, count: 0, length_m: 0, area_m2: 0, count_value: 0 };
}

function accumulate(
  row: TakeoffSummaryRow,
  m: TakeoffMeasurement
): TakeoffSummaryRow {
  return {
    ...row,
    count: row.count + 1,
    length_m: row.length_m + (m.length_m ?? 0),
    area_m2: row.area_m2 + (m.area_m2 ?? 0),
    count_value: row.count_value + (m.count_value ?? 0),
  };
}

export function summarizeByLayer(
  measurements: TakeoffMeasurement[],
  layers: TakeoffLayer[]
): TakeoffSummaryRow[] {
  const nameById = new Map(layers.map((l) => [l.id, l.name]));
  const map = new Map<string, TakeoffSummaryRow>();
  for (const m of measurements) {
    const key = m.layer_id ?? 'none';
    const label = m.layer_id
      ? (nameById.get(m.layer_id) ?? 'Unknown layer')
      : 'Unassigned';
    map.set(key, accumulate(map.get(key) ?? emptyRow(key, label), m));
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function summarizeByDiscipline(
  measurements: TakeoffMeasurement[]
): TakeoffSummaryRow[] {
  const map = new Map<string, TakeoffSummaryRow>();
  for (const m of measurements) {
    const label = m.discipline?.trim() || 'Unassigned';
    const key = label.toLowerCase();
    map.set(key, accumulate(map.get(key) ?? emptyRow(key, label), m));
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function summarizeByMeasurementType(
  measurements: TakeoffMeasurement[]
): TakeoffSummaryRow[] {
  const map = new Map<string, TakeoffSummaryRow>();
  for (const m of measurements) {
    const key = m.tool_type;
    const label = m.tool_type;
    map.set(key, accumulate(map.get(key) ?? emptyRow(key, label), m));
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function formatSummaryMetric(row: TakeoffSummaryRow): string {
  const parts: string[] = [`${row.count} items`];
  if (row.length_m > 0) parts.push(`${row.length_m.toFixed(2)} m`);
  if (row.area_m2 > 0) parts.push(`${row.area_m2.toFixed(2)} m²`);
  if (row.count_value > 0) parts.push(`count ${row.count_value}`);
  return parts.join(' · ');
}
