/**
 * Pure geometry helpers for Quantity Takeoff measurement engine (metric).
 * Phase 3 — line / area / rectangle / circle / count + edit transforms.
 */

import type {
  TakeoffGeometry,
  TakeoffMeasurement,
  TakeoffPoint,
} from '@/types/takeoff';

export const SNAP_THRESHOLD_PX = 12;

export function distance(a: TakeoffPoint, b: TakeoffPoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function polylineLength(points: TakeoffPoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += distance(points[i - 1], points[i]);
  }
  return total;
}

/** Closed perimeter (closes back to first point). */
export function polygonPerimeter(points: TakeoffPoint[]): number {
  if (points.length < 2) return 0;
  return polylineLength(points) + distance(points[points.length - 1], points[0]);
}

/** Shoelace formula — absolute area in square coordinate units. */
export function polygonArea(points: TakeoffPoint[]): number {
  if (points.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const j = (i + 1) % points.length;
    sum += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  return Math.abs(sum) / 2;
}

export function rectanglePoints(
  a: TakeoffPoint,
  b: TakeoffPoint
): TakeoffPoint[] {
  return [
    { x: a.x, y: a.y },
    { x: b.x, y: a.y },
    { x: b.x, y: b.y },
    { x: a.x, y: b.y },
  ];
}

export function centroid(points: TakeoffPoint[]): TakeoffPoint | null {
  if (points.length === 0) return null;
  let x = 0;
  let y = 0;
  for (const p of points) {
    x += p.x;
    y += p.y;
  }
  return { x: x / points.length, y: y / points.length };
}

export function geometryPoints(geometry: TakeoffGeometry, tool: string): TakeoffPoint[] {
  if (tool === 'circle' && geometry.center && geometry.radius != null) {
    return [geometry.center];
  }
  if (tool === 'rectangle' && (geometry.points?.length ?? 0) >= 2) {
    return rectanglePoints(geometry.points![0], geometry.points![1]);
  }
  return geometry.points ?? [];
}

export function translatePoints(
  points: TakeoffPoint[],
  dx: number,
  dy: number
): TakeoffPoint[] {
  return points.map((p) => ({ x: p.x + dx, y: p.y + dy }));
}

export function rotatePoints(
  points: TakeoffPoint[],
  origin: TakeoffPoint,
  degrees: number
): TakeoffPoint[] {
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return points.map((p) => {
    const dx = p.x - origin.x;
    const dy = p.y - origin.y;
    return {
      x: origin.x + dx * cos - dy * sin,
      y: origin.y + dx * sin + dy * cos,
    };
  });
}

export function scalePoints(
  points: TakeoffPoint[],
  origin: TakeoffPoint,
  factor: number
): TakeoffPoint[] {
  return points.map((p) => ({
    x: origin.x + (p.x - origin.x) * factor,
    y: origin.y + (p.y - origin.y) * factor,
  }));
}

export function movePointAt(
  points: TakeoffPoint[],
  index: number,
  next: TakeoffPoint
): TakeoffPoint[] {
  return points.map((p, i) => (i === index ? { ...next } : p));
}

export function insertPointAt(
  points: TakeoffPoint[],
  index: number,
  point: TakeoffPoint
): TakeoffPoint[] {
  const next = [...points];
  next.splice(index, 0, point);
  return next;
}

export function deletePointAt(
  points: TakeoffPoint[],
  index: number
): TakeoffPoint[] {
  return points.filter((_, i) => i !== index);
}

/** Snap cursor to a target if within threshold (page units). */
export function snapToPoint(
  cursor: TakeoffPoint,
  target: TakeoffPoint | null | undefined,
  threshold: number = SNAP_THRESHOLD_PX
): TakeoffPoint {
  if (!target) return cursor;
  return distance(cursor, target) <= threshold ? { ...target } : cursor;
}

/** Close polygon when cursor is near first vertex. */
export function shouldAutoClose(
  points: TakeoffPoint[],
  cursor: TakeoffPoint,
  threshold: number = SNAP_THRESHOLD_PX
): boolean {
  if (points.length < 3) return false;
  return distance(cursor, points[0]) <= threshold;
}

export function pointInBox(
  p: TakeoffPoint,
  a: TakeoffPoint,
  b: TakeoffPoint
): boolean {
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);
  return p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY;
}

export function hitTestVertex(
  points: TakeoffPoint[],
  cursor: TakeoffPoint,
  threshold: number = SNAP_THRESHOLD_PX
): number {
  for (let i = 0; i < points.length; i += 1) {
    if (distance(points[i], cursor) <= threshold) return i;
  }
  return -1;
}

/** Hit-test nearest edge; returns insert index (after vertex i). */
export function hitTestEdge(
  points: TakeoffPoint[],
  cursor: TakeoffPoint,
  closed: boolean,
  threshold: number = SNAP_THRESHOLD_PX
): { insertAfter: number; point: TakeoffPoint } | null {
  if (points.length < 2) return null;
  let best: { insertAfter: number; point: TakeoffPoint; dist: number } | null =
    null;
  const edges = closed ? points.length : points.length - 1;
  for (let i = 0; i < edges; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const proj = projectOnSegment(cursor, a, b);
    const d = distance(cursor, proj);
    if (d <= threshold && (!best || d < best.dist)) {
      best = { insertAfter: i + 1, point: proj, dist: d };
    }
  }
  return best
    ? { insertAfter: best.insertAfter, point: best.point }
    : null;
}

function projectOnSegment(
  p: TakeoffPoint,
  a: TakeoffPoint,
  b: TakeoffPoint
): TakeoffPoint {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return { ...a };
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return { x: a.x + t * dx, y: a.y + t * dy };
}

export function measurementBounds(
  m: TakeoffMeasurement
): { min: TakeoffPoint; max: TakeoffPoint } | null {
  const pts = geometryPoints(m.geometry, m.tool_type);
  if (m.tool_type === 'circle' && m.geometry.center && m.geometry.radius != null) {
    const c = m.geometry.center;
    const r = m.geometry.radius;
    return {
      min: { x: c.x - r, y: c.y - r },
      max: { x: c.x + r, y: c.y + r },
    };
  }
  if (pts.length === 0) return null;
  let minX = pts[0].x;
  let maxX = pts[0].x;
  let minY = pts[0].y;
  let maxY = pts[0].y;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } };
}

export function hitTestMeasurement(
  m: TakeoffMeasurement,
  cursor: TakeoffPoint,
  threshold: number = SNAP_THRESHOLD_PX
): boolean {
  if (m.tool_type === 'circle' && m.geometry.center && m.geometry.radius != null) {
    const d = distance(cursor, m.geometry.center);
    return Math.abs(d - m.geometry.radius) <= threshold || d <= threshold;
  }
  const pts = geometryPoints(m.geometry, m.tool_type);
  if (m.tool_type === 'count' || m.tool_type === 'text') {
    return hitTestVertex(pts, cursor, threshold) >= 0;
  }
  if (hitTestVertex(pts, cursor, threshold) >= 0) return true;
  const closed = m.tool_type === 'area' || m.tool_type === 'rectangle';
  return hitTestEdge(pts, cursor, closed, threshold) != null;
}

export function measurementsInBox(
  list: TakeoffMeasurement[],
  a: TakeoffPoint,
  b: TakeoffPoint
): string[] {
  return list
    .filter((m) => {
      const bounds = measurementBounds(m);
      if (!bounds) return false;
      const cx = (bounds.min.x + bounds.max.x) / 2;
      const cy = (bounds.min.y + bounds.max.y) / 2;
      return pointInBox({ x: cx, y: cy }, a, b);
    })
    .map((m) => m.id);
}

export interface MeasurementMetrics {
  length_m: number | null;
  area_m2: number | null;
  count_value: number | null;
  /** Circle diameter in meters when applicable. */
  diameter_m: number | null;
  /** Live preview values in page pixels (before scale). */
  length_px: number | null;
  area_px: number | null;
  perimeter_px: number | null;
  radius_px: number | null;
}

export function computeMeasurementMetrics(
  tool: string,
  geometry: TakeoffGeometry,
  pixelsPerMeter: number | null
): MeasurementMetrics {
  const ppm = pixelsPerMeter && pixelsPerMeter > 0 ? pixelsPerMeter : null;
  const pts = geometry.points ?? [];
  const empty: MeasurementMetrics = {
    length_m: null,
    area_m2: null,
    count_value: null,
    diameter_m: null,
    length_px: null,
    area_px: null,
    perimeter_px: null,
    radius_px: null,
  };

  if (tool === 'count') {
    return {
      ...empty,
      count_value: pts.length || 1,
    };
  }

  if (tool === 'text') {
    return empty;
  }

  if (tool === 'line' || tool === 'polyline') {
    const px = polylineLength(pts);
    return {
      ...empty,
      length_m: ppm ? px / ppm : null,
      length_px: px,
    };
  }

  if (tool === 'area' || tool === 'rectangle') {
    const poly =
      tool === 'rectangle' && pts.length >= 2
        ? rectanglePoints(pts[0], pts[1])
        : pts;
    const pxArea = polygonArea(poly);
    const peri = polygonPerimeter(poly);
    return {
      ...empty,
      length_m: ppm ? peri / ppm : null,
      area_m2: ppm ? pxArea / (ppm * ppm) : null,
      length_px: peri,
      area_px: pxArea,
      perimeter_px: peri,
    };
  }

  if (tool === 'circle' && geometry.center && geometry.radius != null) {
    const r = geometry.radius;
    const circ = 2 * Math.PI * r;
    const area = Math.PI * r * r;
    return {
      length_m: ppm ? circ / ppm : null,
      area_m2: ppm ? area / (ppm * ppm) : null,
      count_value: null,
      diameter_m: ppm ? (2 * r) / ppm : null,
      length_px: circ,
      area_px: area,
      perimeter_px: circ,
      radius_px: r,
    };
  }

  return empty;
}

/** Recompute stored metric fields after geometry edit. */
export function withUpdatedMetrics(
  measurement: TakeoffMeasurement,
  geometry: TakeoffGeometry,
  pixelsPerMeter?: number | null
): TakeoffMeasurement {
  const ppm = pixelsPerMeter ?? measurement.pixels_per_meter;
  const metrics = computeMeasurementMetrics(
    measurement.tool_type,
    geometry,
    ppm
  );
  return {
    ...measurement,
    geometry,
    length_m: metrics.length_m,
    area_m2: metrics.area_m2,
    count_value: metrics.count_value,
    updated_at: new Date().toISOString(),
  };
}

export function applyTranslate(
  measurement: TakeoffMeasurement,
  dx: number,
  dy: number
): TakeoffMeasurement {
  const g = measurement.geometry;
  if (measurement.tool_type === 'circle' && g.center) {
    return withUpdatedMetrics(measurement, {
      ...g,
      center: { x: g.center.x + dx, y: g.center.y + dy },
      points: g.points
        ? translatePoints(g.points, dx, dy)
        : undefined,
    });
  }
  return withUpdatedMetrics(measurement, {
    ...g,
    points: translatePoints(g.points ?? [], dx, dy),
  });
}

export function applyRotate(
  measurement: TakeoffMeasurement,
  degrees: number
): TakeoffMeasurement {
  const g = measurement.geometry;
  if (measurement.tool_type === 'circle' && g.center) {
    // Circle rotation around center is a no-op for shape; rotate radius handle if present
    if (g.points && g.points.length >= 2) {
      const rotated = rotatePoints(g.points, g.center, degrees);
      return withUpdatedMetrics(measurement, {
        ...g,
        points: rotated,
        radius: distance(g.center, rotated[1] ?? rotated[0]),
      });
    }
    return measurement;
  }
  const pts = g.points ?? [];
  const origin = centroid(pts);
  if (!origin) return measurement;
  return withUpdatedMetrics(measurement, {
    ...g,
    points: rotatePoints(pts, origin, degrees),
  });
}

export function applyScale(
  measurement: TakeoffMeasurement,
  factor: number
): TakeoffMeasurement {
  const g = measurement.geometry;
  if (measurement.tool_type === 'circle' && g.center && g.radius != null) {
    const nextR = g.radius * factor;
    return withUpdatedMetrics(measurement, {
      ...g,
      radius: nextR,
      points: g.points
        ? [
            g.center,
            { x: g.center.x + nextR, y: g.center.y },
          ]
        : undefined,
    });
  }
  const pts = g.points ?? [];
  const origin = centroid(pts);
  if (!origin) return measurement;
  return withUpdatedMetrics(measurement, {
    ...g,
    points: scalePoints(pts, origin, factor),
  });
}

export function pixelsPerMeterFromCalibration(
  pixelLength: number,
  knownLengthMeters: number
): number | null {
  if (pixelLength <= 0 || knownLengthMeters <= 0) return null;
  return pixelLength / knownLengthMeters;
}

/** Format live status string for draft preview. */
export function formatLivePreview(
  tool: string,
  geometry: TakeoffGeometry,
  pixelsPerMeter: number | null
): string {
  const m = computeMeasurementMetrics(tool, geometry, pixelsPerMeter);
  const fmt = (n: number | null, unit: string) =>
    n == null ? `— ${unit}` : `${n.toFixed(3)} ${unit}`;

  if (tool === 'line' || tool === 'polyline') {
    return `Length ${fmt(m.length_m, 'm')}${m.length_px != null ? ` (${m.length_px.toFixed(1)} px)` : ''}`;
  }
  if (tool === 'area' || tool === 'rectangle') {
    return `Area ${fmt(m.area_m2, 'm²')} · Perimeter ${fmt(m.length_m, 'm')}`;
  }
  if (tool === 'circle') {
    const r =
      m.radius_px != null && pixelsPerMeter
        ? m.radius_px / pixelsPerMeter
        : null;
    return `R ${fmt(r, 'm')} · Ø ${fmt(m.diameter_m, 'm')} · Circ ${fmt(m.length_m, 'm')} · Area ${fmt(m.area_m2, 'm²')}`;
  }
  if (tool === 'count') {
    return `Count ${m.count_value ?? 0}`;
  }
  return '';
}
