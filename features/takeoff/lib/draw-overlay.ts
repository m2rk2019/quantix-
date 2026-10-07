/**
 * Canvas overlay renderer — Phase 3 engine + Phase 4 intelligence
 * (labels, hover highlight, snap marker, revision clouds, opacity).
 */

import {
  geometryPoints,
  rectanglePoints,
} from '@/lib/takeoff/geometry';
import type { SnapResult } from '@/lib/takeoff/snap';
import type {
  TakeoffGeometry,
  TakeoffLayer,
  TakeoffMeasurement,
  TakeoffPoint,
  TakeoffRevisionCloud,
} from '@/types/takeoff';

function layerOpacity(
  layers: TakeoffLayer[],
  layerId: string | null
): number {
  if (!layerId) return 1;
  const layer = layers.find((l) => l.id === layerId);
  return layer?.opacity ?? 1;
}

function labelForMeasurement(m: TakeoffMeasurement): string {
  const parts: string[] = [];
  if (m.name) parts.push(m.name);
  if (m.length_m != null && m.tool_type !== 'count') {
    parts.push(`${m.length_m.toFixed(2)} m`);
  }
  if (m.area_m2 != null) {
    parts.push(`${m.area_m2.toFixed(2)} m²`);
  }
  if (m.count_value != null) {
    parts.push(`×${m.count_value}`);
  }
  return parts.join(' · ') || m.tool_type;
}

function labelAnchor(m: TakeoffMeasurement): TakeoffPoint | null {
  if (m.tool_type === 'circle' && m.geometry.center) {
    return {
      x: m.geometry.center.x,
      y: m.geometry.center.y - (m.geometry.radius ?? 0) - 8,
    };
  }
  const pts = geometryPoints(m.geometry, m.tool_type);
  if (pts.length === 0) return null;
  let x = 0;
  let y = 0;
  for (const p of pts) {
    x += p.x;
    y += p.y;
  }
  return { x: x / pts.length, y: y / pts.length };
}

export function drawTakeoffOverlay(opts: {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  zoom: number;
  measurements: TakeoffMeasurement[];
  layers: TakeoffLayer[];
  selectedIds: string[];
  hoveredId: string | null;
  showLabels: boolean;
  draftTool: string;
  draftPoints: TakeoffPoint[];
  draftCursor: TakeoffPoint | null;
  draftColor: string;
  boxSelect: { a: TakeoffPoint; b: TakeoffPoint } | null;
  editHandlesFor: TakeoffMeasurement | null;
  snap: SnapResult | null;
  revisionClouds: TakeoffRevisionCloud[];
}): void {
  const {
    ctx,
    width,
    height,
    zoom,
    measurements,
    layers,
    selectedIds,
    hoveredId,
    showLabels,
    draftTool,
    draftPoints,
    draftCursor,
    draftColor,
    boxSelect,
    editHandlesFor,
    snap,
    revisionClouds,
  } = opts;

  ctx.clearRect(0, 0, width, height);
  const selected = new Set(selectedIds);

  for (const cloud of revisionClouds) {
    drawRevisionCloud(ctx, cloud, zoom);
  }

  for (const m of measurements) {
    const opacity = layerOpacity(layers, m.layer_id);
    ctx.save();
    ctx.globalAlpha = opacity;
    const highlight = selected.has(m.id) || m.id === hoveredId;
    drawGeom(
      ctx,
      m.geometry,
      m.color,
      m.tool_type,
      zoom,
      highlight,
      m.id === hoveredId
    );
    if (m.tool_type === 'count') {
      drawCountNumbers(ctx, m.geometry.points ?? [], m.color, zoom);
    }
    if (showLabels) {
      const anchor = labelAnchor(m);
      if (anchor) {
        drawLabel(ctx, labelForMeasurement(m), anchor, m.color, zoom);
      }
    }
    ctx.restore();
  }

  if (draftPoints.length > 0 || draftCursor) {
    const previewPts =
      draftCursor && draftTool !== 'circle' && draftTool !== 'revision-cloud'
        ? [...draftPoints, draftCursor]
        : draftPoints;
    let geom: TakeoffGeometry = { points: previewPts };
    if (draftTool === 'circle' && draftPoints[0]) {
      const edge = draftCursor ?? draftPoints[0];
      geom = {
        center: draftPoints[0],
        radius: Math.hypot(
          edge.x - draftPoints[0].x,
          edge.y - draftPoints[0].y
        ),
        points: [draftPoints[0], edge],
      };
    } else if (
      (draftTool === 'rectangle' || draftTool === 'revision-cloud') &&
      draftPoints[0]
    ) {
      geom = {
        points: [draftPoints[0], draftCursor ?? draftPoints[0]],
      };
    }
    if (draftTool === 'revision-cloud' && draftPoints[0] && draftCursor) {
      drawRevisionCloudPreview(ctx, draftPoints[0], draftCursor, zoom);
    } else {
      drawGeom(
        ctx,
        geom,
        draftColor,
        draftTool === 'calibrate' ? 'line' : draftTool,
        zoom,
        true
      );
    }
    for (const p of draftPoints) {
      drawHandle(ctx, p, zoom, draftColor);
    }
  }

  if (editHandlesFor) {
    const pts = geometryPoints(
      editHandlesFor.geometry,
      editHandlesFor.tool_type
    );
    for (const p of pts) {
      drawHandle(ctx, p, zoom, '#f59e0b');
    }
    if (
      editHandlesFor.tool_type === 'circle' &&
      editHandlesFor.geometry.center &&
      editHandlesFor.geometry.radius != null
    ) {
      const c = editHandlesFor.geometry.center;
      drawHandle(ctx, c, zoom, '#f59e0b');
      drawHandle(
        ctx,
        { x: c.x + editHandlesFor.geometry.radius, y: c.y },
        zoom,
        '#f59e0b'
      );
    }
  }

  if (snap) {
    drawSnapMarker(ctx, snap.point, snap.kind, zoom);
  }

  if (boxSelect) {
    const x = Math.min(boxSelect.a.x, boxSelect.b.x) * zoom;
    const y = Math.min(boxSelect.a.y, boxSelect.b.y) * zoom;
    const w = Math.abs(boxSelect.b.x - boxSelect.a.x) * zoom;
    const h = Math.abs(boxSelect.b.y - boxSelect.a.y) * zoom;
    ctx.save();
    ctx.strokeStyle = '#3b82f6';
    ctx.fillStyle = 'rgba(59, 130, 246, 0.12)';
    ctx.setLineDash([4, 4]);
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
  }
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  anchor: TakeoffPoint,
  color: string,
  zoom: number
): void {
  const x = anchor.x * zoom;
  const y = anchor.y * zoom;
  ctx.save();
  ctx.font = `${11 * Math.max(zoom * 0.85, 0.7)}px sans-serif`;
  const w = ctx.measureText(text).width + 8;
  const h = 16;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h - 4, w, h, 3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y - h / 2 - 4);
  ctx.restore();
}

function drawSnapMarker(
  ctx: CanvasRenderingContext2D,
  p: TakeoffPoint,
  kind: string,
  zoom: number
): void {
  const x = p.x * zoom;
  const y = p.y * zoom;
  ctx.save();
  ctx.strokeStyle = '#f59e0b';
  ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
  ctx.lineWidth = 2;
  if (kind === 'endpoint') {
    ctx.strokeRect(x - 5, y - 5, 10, 10);
  } else if (kind === 'midpoint') {
    ctx.beginPath();
    ctx.moveTo(x, y - 6);
    ctx.lineTo(x + 6, y);
    ctx.lineTo(x, y + 6);
    ctx.lineTo(x - 6, y);
    ctx.closePath();
    ctx.stroke();
  } else if (kind === 'intersection') {
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 6);
    ctx.lineTo(x + 6, y + 6);
    ctx.moveTo(x + 6, y - 6);
    ctx.lineTo(x - 6, y + 6);
    ctx.stroke();
  } else if (kind === 'perpendicular') {
    ctx.strokeRect(x - 4, y - 4, 8, 8);
    ctx.beginPath();
    ctx.moveTo(x, y - 8);
    ctx.lineTo(x, y + 8);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.font = '10px sans-serif';
  ctx.fillStyle = '#92400e';
  ctx.fillText(kind, x + 8, y - 8);
  ctx.restore();
}

function drawRevisionCloud(
  ctx: CanvasRenderingContext2D,
  cloud: TakeoffRevisionCloud,
  zoom: number
): void {
  const pts = cloud.geometry.points ?? [];
  if (pts.length < 3) return;
  ctx.save();
  ctx.strokeStyle = cloud.color;
  ctx.fillStyle = cloud.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pts[0].x * zoom, pts[0].y * zoom);
  for (let i = 1; i < pts.length; i += 1) {
    ctx.lineTo(pts[i].x * zoom, pts[i].y * zoom);
  }
  ctx.closePath();
  ctx.globalAlpha = 0.08;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.stroke();
  if (cloud.label) {
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    ctx.font = '11px sans-serif';
    ctx.fillStyle = cloud.color;
    ctx.fillText(cloud.label, cx * zoom, cy * zoom);
  }
  ctx.restore();
}

function drawRevisionCloudPreview(
  ctx: CanvasRenderingContext2D,
  a: TakeoffPoint,
  b: TakeoffPoint,
  zoom: number
): void {
  const x = Math.min(a.x, b.x) * zoom;
  const y = Math.min(a.y, b.y) * zoom;
  const w = Math.abs(b.x - a.x) * zoom;
  const h = Math.abs(b.y - a.y) * zoom;
  ctx.save();
  ctx.strokeStyle = '#ef4444';
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

function drawHandle(
  ctx: CanvasRenderingContext2D,
  p: TakeoffPoint,
  zoom: number,
  color: string
): void {
  const s = 5;
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(p.x * zoom - s, p.y * zoom - s, s * 2, s * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawCountNumbers(
  ctx: CanvasRenderingContext2D,
  points: TakeoffPoint[],
  color: string,
  zoom: number
): void {
  ctx.save();
  ctx.font = `${11 * Math.max(zoom, 0.75)}px sans-serif`;
  ctx.fillStyle = color;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  points.forEach((p, i) => {
    const label = String(i + 1);
    const x = p.x * zoom + 8;
    const y = p.y * zoom - 8;
    ctx.strokeText(label, x, y);
    ctx.fillText(label, x, y);
  });
  ctx.restore();
}

function drawGeom(
  ctx: CanvasRenderingContext2D,
  geom: TakeoffGeometry,
  color: string,
  toolType: string,
  zoom: number,
  highlight?: boolean,
  hovered?: boolean
): void {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = hovered ? 4 : highlight ? 3 : 2;

  if (toolType === 'circle' && geom.center && geom.radius != null) {
    ctx.beginPath();
    ctx.arc(
      geom.center.x * zoom,
      geom.center.y * zoom,
      geom.radius * zoom,
      0,
      Math.PI * 2
    );
    ctx.globalAlpha = hovered ? 0.25 : highlight ? 0.12 : 0.08;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(geom.center.x * zoom, geom.center.y * zoom);
    ctx.lineTo((geom.center.x + geom.radius) * zoom, geom.center.y * zoom);
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
    return;
  }

  if (toolType === 'count') {
    for (const p of geom.points ?? []) {
      ctx.beginPath();
      ctx.arc(p.x * zoom, p.y * zoom, hovered ? 8 : 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.strokeStyle = color;
      ctx.lineWidth = hovered ? 4 : highlight ? 3 : 2;
    }
    return;
  }

  if (toolType === 'text' && geom.points?.[0]) {
    ctx.font = `${14 * zoom}px sans-serif`;
    ctx.fillText(geom.text ?? '', geom.points[0].x * zoom, geom.points[0].y * zoom);
    return;
  }

  let poly = geom.points ?? [];
  if (toolType === 'rectangle' && poly.length >= 2) {
    poly = rectanglePoints(poly[0], poly[1]);
  }
  if (poly.length < 1) return;

  ctx.beginPath();
  ctx.moveTo(poly[0].x * zoom, poly[0].y * zoom);
  for (let i = 1; i < poly.length; i += 1) {
    ctx.lineTo(poly[i].x * zoom, poly[i].y * zoom);
  }
  if (toolType === 'area' || toolType === 'rectangle') {
    ctx.closePath();
    ctx.globalAlpha = hovered ? 0.3 : highlight ? 0.22 : 0.15;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.stroke();

  if (highlight) {
    for (const p of poly) {
      drawHandle(ctx, p, zoom, color);
    }
  }
}
