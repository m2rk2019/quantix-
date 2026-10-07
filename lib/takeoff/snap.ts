/**
 * Snap engine for Quantity Takeoff Drawing Intelligence (Phase 4).
 * Endpoint · Midpoint · Intersection · Perpendicular · Nearest
 */

import {
  distance,
  geometryPoints,
  SNAP_THRESHOLD_PX,
} from '@/lib/takeoff/geometry';
import type {
  TakeoffMeasurement,
  TakeoffPoint,
  TakeoffRevisionCloud,
} from '@/types/takeoff';

export type SnapKind =
  | 'endpoint'
  | 'midpoint'
  | 'intersection'
  | 'perpendicular'
  | 'nearest';

export interface SnapCandidate {
  point: TakeoffPoint;
  kind: SnapKind;
  sourceId?: string;
}

export interface SnapResult {
  point: TakeoffPoint;
  kind: SnapKind;
  distance: number;
}

export interface SnapModeFlags {
  endpoint: boolean;
  midpoint: boolean;
  intersection: boolean;
  perpendicular: boolean;
  nearest: boolean;
}

export const DEFAULT_SNAP_MODES: SnapModeFlags = {
  endpoint: true,
  midpoint: true,
  intersection: true,
  perpendicular: true,
  nearest: true,
};

export function midpoint(a: TakeoffPoint, b: TakeoffPoint): TakeoffPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** Closest point on segment AB to P. */
export function closestOnSegment(
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

/** Segment intersection (inclusive of endpoints within epsilon). */
export function segmentIntersection(
  a1: TakeoffPoint,
  a2: TakeoffPoint,
  b1: TakeoffPoint,
  b2: TakeoffPoint
): TakeoffPoint | null {
  const dax = a2.x - a1.x;
  const day = a2.y - a1.y;
  const dbx = b2.x - b1.x;
  const dby = b2.y - b1.y;
  const denom = dax * dby - day * dbx;
  if (Math.abs(denom) < 1e-9) return null;
  const t = ((b1.x - a1.x) * dby - (b1.y - a1.y) * dbx) / denom;
  const u = ((b1.x - a1.x) * day - (b1.y - a1.y) * dax) / denom;
  if (t < -1e-6 || t > 1 + 1e-6 || u < -1e-6 || u > 1 + 1e-6) return null;
  return { x: a1.x + t * dax, y: a1.y + t * day };
}

function collectSegments(
  measurements: TakeoffMeasurement[]
): Array<{ a: TakeoffPoint; b: TakeoffPoint; id: string }> {
  const segs: Array<{ a: TakeoffPoint; b: TakeoffPoint; id: string }> = [];
  for (const m of measurements) {
    if (m.tool_type === 'count' || m.tool_type === 'text') continue;
    if (m.tool_type === 'circle' && m.geometry.center && m.geometry.radius != null) {
      // approximate circle with diameter endpoints for snap
      const c = m.geometry.center;
      const r = m.geometry.radius;
      segs.push({
        a: { x: c.x - r, y: c.y },
        b: { x: c.x + r, y: c.y },
        id: m.id,
      });
      segs.push({
        a: { x: c.x, y: c.y - r },
        b: { x: c.x, y: c.y + r },
        id: m.id,
      });
      continue;
    }
    const pts = geometryPoints(m.geometry, m.tool_type);
    const closed = m.tool_type === 'area' || m.tool_type === 'rectangle';
    const n = closed ? pts.length : pts.length - 1;
    for (let i = 0; i < n; i += 1) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      if (a && b) segs.push({ a, b, id: m.id });
    }
  }
  return segs;
}

export function collectSnapCandidates(
  measurements: TakeoffMeasurement[],
  cursor: TakeoffPoint,
  draftFrom: TakeoffPoint | null,
  modes: SnapModeFlags = DEFAULT_SNAP_MODES
): SnapCandidate[] {
  const out: SnapCandidate[] = [];
  const segs = collectSegments(measurements);

  if (modes.endpoint) {
    for (const m of measurements) {
      const pts = geometryPoints(m.geometry, m.tool_type);
      for (const p of pts) {
        out.push({ point: p, kind: 'endpoint', sourceId: m.id });
      }
      if (m.tool_type === 'circle' && m.geometry.center) {
        out.push({
          point: m.geometry.center,
          kind: 'endpoint',
          sourceId: m.id,
        });
      }
    }
  }

  if (modes.midpoint) {
    for (const s of segs) {
      out.push({
        point: midpoint(s.a, s.b),
        kind: 'midpoint',
        sourceId: s.id,
      });
    }
  }

  if (modes.intersection && draftFrom) {
    for (const s of segs) {
      const hit = segmentIntersection(draftFrom, cursor, s.a, s.b);
      if (hit) {
        out.push({ point: hit, kind: 'intersection', sourceId: s.id });
      }
    }
    // also existing segment vs segment near cursor
    for (let i = 0; i < segs.length; i += 1) {
      for (let j = i + 1; j < segs.length; j += 1) {
        if (segs[i].id === segs[j].id) continue;
        const hit = segmentIntersection(
          segs[i].a,
          segs[i].b,
          segs[j].a,
          segs[j].b
        );
        if (hit && distance(hit, cursor) <= SNAP_THRESHOLD_PX * 2) {
          out.push({ point: hit, kind: 'intersection', sourceId: segs[i].id });
        }
      }
    }
  }

  if (modes.perpendicular && draftFrom) {
    for (const s of segs) {
      const foot = closestOnSegment(draftFrom, s.a, s.b);
      // true perpendicular: vector from draftFrom to foot ⊥ segment? 
      // For CAD-style: project cursor onto line through draftFrom perpendicular to segment —
      // simpler: snap to foot of perpendicular from draftFrom onto segment when cursor near that foot.
      const dx = s.b.x - s.a.x;
      const dy = s.b.y - s.a.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      // ray from draftFrom along normal — intersect segment's infinite line, clamp
      const t =
        ((draftFrom.x - s.a.x) * dx + (draftFrom.y - s.a.y) * dy) /
        (dx * dx + dy * dy || 1);
      const clamped = Math.max(0, Math.min(1, t));
      const perpPt = {
        x: s.a.x + clamped * dx,
        y: s.a.y + clamped * dy,
      };
      void foot;
      void nx;
      void ny;
      out.push({
        point: perpPt,
        kind: 'perpendicular',
        sourceId: s.id,
      });
    }
  }

  if (modes.nearest) {
    for (const s of segs) {
      out.push({
        point: closestOnSegment(cursor, s.a, s.b),
        kind: 'nearest',
        sourceId: s.id,
      });
    }
    for (const m of measurements) {
      if (m.tool_type === 'circle' && m.geometry.center && m.geometry.radius != null) {
        const c = m.geometry.center;
        const r = m.geometry.radius;
        const ang = Math.atan2(cursor.y - c.y, cursor.x - c.x);
        out.push({
          point: {
            x: c.x + Math.cos(ang) * r,
            y: c.y + Math.sin(ang) * r,
          },
          kind: 'nearest',
          sourceId: m.id,
        });
      }
    }
  }

  return out;
}

const SNAP_PRIORITY: SnapKind[] = [
  'endpoint',
  'midpoint',
  'intersection',
  'perpendicular',
  'nearest',
];

export function resolveSnap(
  cursor: TakeoffPoint,
  candidates: SnapCandidate[],
  threshold = SNAP_THRESHOLD_PX
): SnapResult | null {
  let best: SnapResult | null = null;
  for (const c of candidates) {
    const d = distance(cursor, c.point);
    if (d > threshold) continue;
    const pri = SNAP_PRIORITY.indexOf(c.kind);
    if (
      !best ||
      pri < SNAP_PRIORITY.indexOf(best.kind) ||
      (pri === SNAP_PRIORITY.indexOf(best.kind) && d < best.distance)
    ) {
      best = { point: c.point, kind: c.kind, distance: d };
    }
  }
  return best;
}

export function snapCursor(
  cursor: TakeoffPoint,
  measurements: TakeoffMeasurement[],
  draftFrom: TakeoffPoint | null,
  modes: SnapModeFlags = DEFAULT_SNAP_MODES,
  threshold = SNAP_THRESHOLD_PX
): SnapResult | null {
  const candidates = collectSnapCandidates(
    measurements,
    cursor,
    draftFrom,
    modes
  );
  return resolveSnap(cursor, candidates, threshold);
}

export function snapKindLabel(kind: SnapKind): string {
  switch (kind) {
    case 'endpoint':
      return 'Endpoint';
    case 'midpoint':
      return 'Midpoint';
    case 'intersection':
      return 'Intersection';
    case 'perpendicular':
      return 'Perpendicular';
    case 'nearest':
      return 'Nearest';
    default:
      return 'Snap';
  }
}

/** Build a jagged revision-cloud polygon from a bounding box. */
export function buildRevisionCloud(
  a: TakeoffPoint,
  b: TakeoffPoint,
  bulges = 10
): TakeoffPoint[] {
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);
  const w = Math.max(maxX - minX, 8);
  const h = Math.max(maxY - minY, 8);
  const pts: TakeoffPoint[] = [];
  const bump = Math.min(w, h) * 0.12;

  const edge = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    outwardX: number,
    outwardY: number
  ) => {
    for (let i = 0; i < bulges; i += 1) {
      const t0 = i / bulges;
      const t1 = (i + 0.5) / bulges;
      const t2 = (i + 1) / bulges;
      pts.push({
        x: x0 + (x1 - x0) * t0,
        y: y0 + (y1 - y0) * t0,
      });
      pts.push({
        x: x0 + (x1 - x0) * t1 + outwardX * bump,
        y: y0 + (y1 - y0) * t1 + outwardY * bump,
      });
      if (i === bulges - 1) {
        pts.push({
          x: x0 + (x1 - x0) * t2,
          y: y0 + (y1 - y0) * t2,
        });
      }
    }
  };

  edge(minX, minY, maxX, minY, 0, -1);
  edge(maxX, minY, maxX, maxY, 1, 0);
  edge(maxX, maxY, minX, maxY, 0, 1);
  edge(minX, maxY, minX, minY, -1, 0);
  return pts;
}

export type { TakeoffRevisionCloud };
