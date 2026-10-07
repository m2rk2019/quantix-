/**
 * Takeoff ↔ BOQ quantity sync helpers (Phase 5).
 * Pure functions — no Import Engine / template changes.
 */

import type { TakeoffMeasurement } from '@/types/takeoff';

export type BoqQuantitySource = 'takeoff' | 'excel_import' | 'manual';

export const QUANTITY_SOURCE_LABELS: Record<BoqQuantitySource, string> = {
  takeoff: 'Takeoff',
  excel_import: 'Excel Import',
  manual: 'Manual Entry',
};

/** Emoji + label for badges (UI). */
export const QUANTITY_SOURCE_BADGES: Record<
  BoqQuantitySource,
  { emoji: string; label: string; className: string }
> = {
  takeoff: {
    emoji: '📐',
    label: 'Takeoff',
    className: 'bg-sky-100 text-sky-800 border-sky-200',
  },
  excel_import: {
    emoji: '📊',
    label: 'Excel Import',
    className: 'bg-violet-100 text-violet-800 border-violet-200',
  },
  manual: {
    emoji: '✍',
    label: 'Manual Entry',
    className: 'bg-amber-100 text-amber-900 border-amber-200',
  },
};

/**
 * Resolve the numeric contribution of one measurement for BOQ qty sync.
 * Prefers area → length → count (matches typical takeoff→BOQ mapping).
 */
export function measurementQuantityValue(m: TakeoffMeasurement): number {
  if (m.area_m2 != null && Number.isFinite(m.area_m2)) {
    return Number(m.area_m2);
  }
  if (m.length_m != null && Number.isFinite(m.length_m)) {
    return Number(m.length_m);
  }
  if (m.count_value != null && Number.isFinite(m.count_value)) {
    return Number(m.count_value);
  }
  return 0;
}

/** Sum linked measurements into a single BOQ quantity. */
export function sumLinkedQuantities(
  measurements: TakeoffMeasurement[]
): number {
  const total = measurements.reduce(
    (sum, m) => sum + measurementQuantityValue(m),
    0
  );
  return Math.round(total * 1e6) / 1e6;
}

export function deriveQuantitySource(input: {
  explicit?: string | null;
  hasTakeoffLinks: boolean;
  importedAt?: string | null;
  sourceWorkbook?: string | null;
}): BoqQuantitySource {
  if (
    input.explicit === 'takeoff' ||
    input.explicit === 'excel_import' ||
    input.explicit === 'manual'
  ) {
    return input.explicit;
  }
  if (input.hasTakeoffLinks) return 'takeoff';
  if (input.importedAt || input.sourceWorkbook) return 'excel_import';
  return 'manual';
}

export interface TakeoffBoqDashboardStats {
  measured_boq_items: number;
  pending_assignment: number;
  manual_boq: number;
  imported_boq: number;
  total_boq: number;
  coverage_percent: number;
}

export function computeTakeoffBoqDashboard(input: {
  totalBoq: number;
  boqWithTakeoff: number;
  measurementsUnassigned: number;
  manualBoq: number;
  importedBoq: number;
}): TakeoffBoqDashboardStats {
  const coverage =
    input.totalBoq > 0
      ? Math.round((input.boqWithTakeoff / input.totalBoq) * 1000) / 10
      : 0;
  return {
    measured_boq_items: input.boqWithTakeoff,
    pending_assignment: input.measurementsUnassigned,
    manual_boq: input.manualBoq,
    imported_boq: input.importedBoq,
    total_boq: input.totalBoq,
    coverage_percent: coverage,
  };
}

export type TakeoffBoqValidationCode =
  | 'measurement_no_boq'
  | 'boq_no_measurement'
  | 'deleted_measurement'
  | 'duplicate_assignment';

export interface TakeoffBoqValidationIssue {
  code: TakeoffBoqValidationCode;
  severity: 'warning' | 'error';
  message: string;
  measurementId?: string;
  boqId?: string;
}
