/**
 * Quantity Takeoff measurement engine — selection, clipboard, draft helpers.
 * Isolated from BOQ. Phase 3.
 */

import {
  applyRotate,
  applyScale,
  applyTranslate,
  computeMeasurementMetrics,
  formatLivePreview,
  hitTestMeasurement,
  measurementsInBox,
  shouldAutoClose,
  snapToPoint,
  withUpdatedMetrics,
} from '@/lib/takeoff/geometry';
import type {
  TakeoffGeometry,
  TakeoffMeasurement,
  TakeoffPoint,
} from '@/types/takeoff';

export type EngineDraftMode =
  | 'idle'
  | 'line'
  | 'area'
  | 'rectangle'
  | 'circle'
  | 'count'
  | 'calibrate'
  | 'text'
  | 'box-select'
  | 'drag-rect'
  | 'drag-vertex'
  | 'drag-move';

export interface EngineDraft {
  mode: EngineDraftMode;
  points: TakeoffPoint[];
  cursor: TakeoffPoint | null;
  /** For rectangle drag / box select */
  anchor: TakeoffPoint | null;
  /** Vertex edit */
  editMeasurementId: string | null;
  editVertexIndex: number | null;
}

export function emptyDraft(): EngineDraft {
  return {
    mode: 'idle',
    points: [],
    cursor: null,
    anchor: null,
    editMeasurementId: null,
    editVertexIndex: null,
  };
}

export function resolveLinePoint(
  draftPoints: TakeoffPoint[],
  cursor: TakeoffPoint,
  snapEnabled = true
): TakeoffPoint {
  if (!snapEnabled || draftPoints.length === 0) return cursor;
  return snapToPoint(cursor, draftPoints[draftPoints.length - 1]);
}

export function draftGeometryForPreview(
  tool: string,
  draftPoints: TakeoffPoint[],
  cursor: TakeoffPoint | null
): TakeoffGeometry | null {
  if (draftPoints.length === 0 && !cursor) return null;

  if (tool === 'circle' && draftPoints[0]) {
    const center = draftPoints[0];
    const edge = cursor ?? center;
    return {
      center,
      radius: Math.max(0.001, Math.hypot(edge.x - center.x, edge.y - center.y)),
      points: [center, edge],
    };
  }

  if (tool === 'rectangle' && draftPoints[0]) {
    const end = cursor ?? draftPoints[1] ?? draftPoints[0];
    return { points: [draftPoints[0], end] };
  }

  if (tool === 'line' || tool === 'polyline' || tool === 'area' || tool === 'calibrate') {
    const pts = cursor ? [...draftPoints, cursor] : [...draftPoints];
    if (tool === 'area' && cursor && shouldAutoClose(draftPoints, cursor)) {
      return { points: [...draftPoints] };
    }
    return { points: pts };
  }

  if (tool === 'count' && cursor) {
    return { points: [...draftPoints, cursor] };
  }

  return { points: draftPoints };
}

export function livePreviewLabel(
  tool: string,
  draftPoints: TakeoffPoint[],
  cursor: TakeoffPoint | null,
  pixelsPerMeter: number | null
): string {
  const geom = draftGeometryForPreview(tool, draftPoints, cursor);
  if (!geom) return '';
  return formatLivePreview(tool === 'calibrate' ? 'line' : tool, geom, pixelsPerMeter);
}

export function toggleSelection(
  selectedIds: string[],
  id: string,
  additive: boolean
): string[] {
  if (!additive) return [id];
  return selectedIds.includes(id)
    ? selectedIds.filter((x) => x !== id)
    : [...selectedIds, id];
}

export function selectByHit(
  measurements: TakeoffMeasurement[],
  cursor: TakeoffPoint,
  additive: boolean,
  current: string[]
): string[] {
  const hit = [...measurements]
    .reverse()
    .find((m) => hitTestMeasurement(m, cursor));
  if (!hit) return additive ? current : [];
  return toggleSelection(current, hit.id, additive);
}

export function selectByBox(
  measurements: TakeoffMeasurement[],
  a: TakeoffPoint,
  b: TakeoffPoint,
  additive: boolean,
  current: string[]
): string[] {
  const ids = measurementsInBox(measurements, a, b);
  if (!additive) return ids;
  const set = new Set(current);
  for (const id of ids) set.add(id);
  return [...set];
}

export function duplicateMeasurements(
  selected: TakeoffMeasurement[],
  offset = 20
): TakeoffMeasurement[] {
  const stamp = Date.now();
  return selected.map((m, i) => {
    const moved = applyTranslate(m, offset, offset);
    return {
      ...moved,
      id: `local-dup-${stamp}-${i}`,
      name: m.name ? `${m.name} (copy)` : m.name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });
}

export function transformSelected(
  measurements: TakeoffMeasurement[],
  selectedIds: string[],
  op: 'rotate' | 'scale' | 'translate',
  value: number,
  dy = 0
): TakeoffMeasurement[] {
  const set = new Set(selectedIds);
  return measurements.map((m) => {
    if (!set.has(m.id)) return m;
    if (op === 'rotate') return applyRotate(m, value);
    if (op === 'scale') return applyScale(m, value);
    return applyTranslate(m, value, dy);
  });
}

export function editVertex(
  measurement: TakeoffMeasurement,
  index: number,
  point: TakeoffPoint
): TakeoffMeasurement {
  const pts = [...(measurement.geometry.points ?? [])];
  if (index < 0 || index >= pts.length) return measurement;

  if (measurement.tool_type === 'circle' && measurement.geometry.center) {
    if (index === 0) {
      const dx = point.x - measurement.geometry.center.x;
      const dy = point.y - measurement.geometry.center.y;
      const movedCenter = point;
      const edge = pts[1]
        ? { x: pts[1].x + dx, y: pts[1].y + dy }
        : { x: point.x + (measurement.geometry.radius ?? 0), y: point.y };
      return withUpdatedMetrics(measurement, {
        center: movedCenter,
        radius: Math.hypot(edge.x - movedCenter.x, edge.y - movedCenter.y),
        points: [movedCenter, edge],
      });
    }
    const center = measurement.geometry.center;
    return withUpdatedMetrics(measurement, {
      ...measurement.geometry,
      radius: Math.hypot(point.x - center.x, point.y - center.y),
      points: [center, point],
    });
  }

  pts[index] = point;
  return withUpdatedMetrics(measurement, {
    ...measurement.geometry,
    points: pts,
  });
}

export function insertVertex(
  measurement: TakeoffMeasurement,
  insertAt: number,
  point: TakeoffPoint
): TakeoffMeasurement {
  if (
    measurement.tool_type === 'circle' ||
    measurement.tool_type === 'count' ||
    measurement.tool_type === 'text'
  ) {
    return measurement;
  }
  const pts = [...(measurement.geometry.points ?? [])];
  pts.splice(insertAt, 0, point);
  return withUpdatedMetrics(measurement, {
    ...measurement.geometry,
    points: pts,
  });
}

export function deleteVertex(
  measurement: TakeoffMeasurement,
  index: number
): TakeoffMeasurement | null {
  const pts = [...(measurement.geometry.points ?? [])];
  if (index < 0 || index >= pts.length) return measurement;
  const minPts =
    measurement.tool_type === 'area'
      ? 3
      : measurement.tool_type === 'rectangle'
        ? 2
        : measurement.tool_type === 'count'
          ? 1
          : 2;
  if (pts.length <= minPts) return null;
  pts.splice(index, 1);
  if (measurement.tool_type === 'count' && pts.length === 0) return null;
  return withUpdatedMetrics(measurement, {
    ...measurement.geometry,
    points: pts,
  });
}

export function appendCountMarker(
  measurement: TakeoffMeasurement,
  point: TakeoffPoint
): TakeoffMeasurement {
  const pts = [...(measurement.geometry.points ?? []), point];
  return withUpdatedMetrics(measurement, {
    ...measurement.geometry,
    points: pts,
  });
}

export {
  computeMeasurementMetrics,
  formatLivePreview,
  hitTestMeasurement,
  withUpdatedMetrics,
};
