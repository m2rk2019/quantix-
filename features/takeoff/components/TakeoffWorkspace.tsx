'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import {
  Circle,
  Cloud,
  Copy,
  Crosshair,
  Hand,
  Magnet,
  Minus,
  MousePointer2,
  Pentagon,
  RotateCw,
  Ruler,
  Square,
  Tag,
  Type,
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  Scaling,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CommentsPanel } from '@/features/takeoff/components/CommentsPanel';
import { DrawingExplorer } from '@/features/takeoff/components/DrawingExplorer';
import { LayerManager } from '@/features/takeoff/components/LayerManager';
import { MeasurementPanel } from '@/features/takeoff/components/MeasurementPanel';
import { ReviewDashboard } from '@/features/takeoff/components/ReviewDashboard';
import { TakeoffBoqDashboard } from '@/features/takeoff/components/TakeoffBoqDashboard';
import { TakeoffBoqValidationPanel } from '@/features/takeoff/components/TakeoffBoqValidationPanel';
import { TakeoffExportMenu } from '@/features/takeoff/components/TakeoffExportMenu';
import { TakeoffPalette } from '@/features/takeoff/components/TakeoffPalette';
import { TakeoffPropertiesPanel } from '@/features/takeoff/components/TakeoffPropertiesPanel';
import { TakeoffSummaryBar } from '@/features/takeoff/components/TakeoffSummaryBar';
import { drawTakeoffOverlay } from '@/features/takeoff/lib/draw-overlay';
import type {
  TakeoffBoqDashboardStats,
  TakeoffBoqValidationIssue,
} from '@/lib/takeoff/boq-sync';
import { cn } from '@/lib/utils';
import {
  appendCountMarker,
  deleteVertex,
  duplicateMeasurements,
  editVertex,
  emptyDraft,
  insertVertex,
  livePreviewLabel,
  resolveLinePoint,
  selectByBox,
  selectByHit,
  transformSelected,
} from '@/lib/takeoff/engine';
import {
  distance,
  geometryPoints,
  hitTestEdge,
  hitTestMeasurement,
  hitTestVertex,
  pixelsPerMeterFromCalibration,
  shouldAutoClose,
  SNAP_THRESHOLD_PX,
} from '@/lib/takeoff/geometry';
import {
  TAKEOFF_SHORTCUTS,
  TakeoffHistoryStack,
} from '@/lib/takeoff/history';
import type { TakeoffPalettePreset } from '@/lib/takeoff/palette';
import { computeReviewStats } from '@/lib/takeoff/review';
import {
  buildRevisionCloud,
  DEFAULT_SNAP_MODES,
  snapCursor,
  snapKindLabel,
  type SnapModeFlags,
  type SnapResult,
} from '@/lib/takeoff/snap';
import {
  assignMeasurementToBoq,
  getTakeoffBoqDashboard,
  unassignMeasurementFromBoq,
  validateTakeoffBoqLinks,
} from '@/services/takeoff/boq-link';
import {
  createTakeoffComment,
  setTakeoffCommentResolved,
} from '@/services/takeoff/comments';
import { uploadTakeoffDrawing } from '@/services/takeoff/drawings';
import {
  createTakeoffMeasurement,
  persistTakeoffMeasurementGeometry,
  softDeleteTakeoffMeasurement,
  updateTakeoffMeasurement,
} from '@/services/takeoff/measurements';
import {
  createTakeoffRevisionCloud,
} from '@/services/takeoff/revision-clouds';
import {
  saveSheetCalibration,
  updateSheetMeta,
  updateSheetRotation,
  updateTakeoffLayer,
} from '@/services/takeoff/sheets-layers';
import type {
  TakeoffBoqLink,
  TakeoffComment,
  TakeoffDrawing,
  TakeoffGeometry,
  TakeoffLayer,
  TakeoffMeasurement,
  TakeoffMeasureTool,
  TakeoffPoint,
  TakeoffRevisionCloud,
  TakeoffReviewStatus,
  TakeoffSheet,
  TakeoffToolType,
} from '@/types/takeoff';

interface BoqOption {
  id: string;
  wbs_id: string;
  wbs_code: string;
  item_code: string;
  description: string;
  unit: string;
  quantity: number;
  quantity_source: string;
}

interface TakeoffWorkspaceProps {
  projectId: string;
  canEdit: boolean;
  initialDrawings: TakeoffDrawing[];
  initialSheets: TakeoffSheet[];
  initialLayers: TakeoffLayer[];
  initialMeasurements: TakeoffMeasurement[];
  initialRevisionClouds?: TakeoffRevisionCloud[];
  initialComments?: TakeoffComment[];
  initialLinks?: TakeoffBoqLink[];
  initialBoqOptions?: BoqOption[];
  initialDashboard?: TakeoffBoqDashboardStats;
  initialValidation?: TakeoffBoqValidationIssue[];
  highlightMeasurementId?: string | null;
  highlightBoqId?: string | null;
}

type LocalState = { measurements: TakeoffMeasurement[] };

const TOOLS: Array<{
  id: TakeoffToolType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
}> = [
  { id: 'select', label: 'Select', icon: MousePointer2, shortcut: 'V' },
  { id: 'pan', label: 'Pan', icon: Hand, shortcut: 'H' },
  { id: 'line', label: 'Line', icon: Minus, shortcut: 'L' },
  { id: 'polyline', label: 'Polyline', icon: Pentagon, shortcut: 'P' },
  { id: 'area', label: 'Area', icon: Pentagon, shortcut: 'A' },
  { id: 'rectangle', label: 'Rectangle', icon: Square, shortcut: 'R' },
  { id: 'circle', label: 'Circle', icon: Circle, shortcut: 'C' },
  { id: 'count', label: 'Count', icon: Crosshair, shortcut: 'N' },
  { id: 'text', label: 'Text', icon: Type, shortcut: 'T' },
  { id: 'revision-cloud', label: 'Revision Cloud', icon: Cloud, shortcut: 'M' },
  { id: 'calibrate', label: 'Calibrate', icon: Ruler, shortcut: 'K' },
];

function isMeasureTool(tool: TakeoffToolType): tool is TakeoffMeasureTool {
  return !['pan', 'calibrate', 'select', 'revision-cloud'].includes(tool);
}

function isLineLike(tool: TakeoffToolType): boolean {
  return tool === 'line' || tool === 'polyline';
}

export function TakeoffWorkspace({
  projectId,
  canEdit,
  initialDrawings,
  initialSheets,
  initialLayers,
  initialMeasurements,
  initialRevisionClouds = [],
  initialComments = [],
  initialLinks = [],
  initialBoqOptions = [],
  initialDashboard,
  initialValidation = [],
  highlightMeasurementId = null,
  highlightBoqId = null,
}: TakeoffWorkspaceProps): React.JSX.Element {
  const [drawings, setDrawings] = useState(initialDrawings);
  const [sheets, setSheets] = useState(initialSheets);
  const [layers, setLayers] = useState(
    initialLayers.map((l) => ({ ...l, opacity: l.opacity ?? 1 }))
  );
  const [state, setState] = useState<LocalState>({
    measurements: initialMeasurements.map((m) => ({
      ...m,
      review_status: m.review_status ?? 'draft',
    })),
  });
  const [revisionClouds, setRevisionClouds] = useState(initialRevisionClouds);
  const [comments, setComments] = useState(initialComments);
  const [links, setLinks] = useState(initialLinks);
  const [boqOptions] = useState(initialBoqOptions);
  const [boqDashboard, setBoqDashboard] = useState<TakeoffBoqDashboardStats>(
    initialDashboard ?? {
      measured_boq_items: 0,
      pending_assignment: 0,
      manual_boq: 0,
      imported_boq: 0,
      total_boq: 0,
      coverage_percent: 0,
    }
  );
  const [validationIssues, setValidationIssues] =
    useState<TakeoffBoqValidationIssue[]>(initialValidation);
  const [boqSyncStatus, setBoqSyncStatus] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [snap, setSnap] = useState<SnapResult | null>(null);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [snapModes] = useState<SnapModeFlags>(DEFAULT_SNAP_MODES);
  const [showLabels, setShowLabels] = useState(true);
  const [reviewFilter, setReviewFilter] = useState<
    TakeoffReviewStatus | 'all' | 'pending'
  >('all');
  const historyRef = useRef(new TakeoffHistoryStack<LocalState>());
  const [, setHistoryTick] = useState(0);

  const [activeDrawingId, setActiveDrawingId] = useState<string | null>(
    initialDrawings[0]?.id ?? null
  );
  const [activeSheetId, setActiveSheetId] = useState<string | null>(
    initialSheets[0]?.id ?? null
  );
  const [selectedIds, setSelectedIds] = useState<string[]>(
    highlightMeasurementId ? [highlightMeasurementId] : []
  );
  const [activeLayerId, setActiveLayerId] = useState<string | null>(
    initialLayers[0]?.id ?? null
  );
  const [activePreset, setActivePreset] = useState<TakeoffPalettePreset | null>(
    null
  );
  const [tool, setTool] = useState<TakeoffToolType>('select');
  const [measureMeta, setMeasureMeta] = useState({
    name: '',
    discipline: 'Architectural',
    unit: 'm',
    color: '#2563eb',
    presetKey: null as string | null,
  });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const [draft, setDraft] = useState(emptyDraft());
  const [cursor, setCursor] = useState<TakeoffPoint | null>(null);
  const [boxSelect, setBoxSelect] = useState<{
    a: TakeoffPoint;
    b: TakeoffPoint;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [calibLength, setCalibLength] = useState('1');
  const [clipboard, setClipboard] = useState<TakeoffMeasurement[]>([]);
  const [isPending, startTransition] = useTransition();
  const dragRef = useRef<{
    kind: 'vertex' | 'move' | 'rect' | 'box';
    id?: string;
    vertexIndex?: number;
    start: TakeoffPoint;
    originMeasurements?: TakeoffMeasurement[];
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<unknown>(null);
  const [pageSize, setPageSize] = useState({ width: 800, height: 600 });
  const [pdfReady, setPdfReady] = useState(false);
  const thumbSaved = useRef<Set<string>>(new Set());

  const activeSheet =
    sheets.find((s) => s.id === activeSheetId) ??
    sheets.find((s) => s.drawing_id === activeDrawingId) ??
    null;
  const activeLayer =
    layers.find((l) => l.id === activeLayerId) ?? layers[0] ?? null;
  const selectedId = selectedIds[0] ?? null;
  const selected =
    state.measurements.find((m) => m.id === selectedId) ?? null;

  const visibleMeasurements = useMemo(() => {
    const hidden = new Set(layers.filter((l) => !l.is_visible).map((l) => l.id));
    return state.measurements.filter((m) => {
      if (m.sheet_id !== activeSheet?.id) return false;
      if (m.layer_id && hidden.has(m.layer_id)) return false;
      const status = m.review_status ?? 'draft';
      if (reviewFilter === 'pending') {
        return status === 'draft' || status === 'checked';
      }
      if (reviewFilter !== 'all' && status !== reviewFilter) return false;
      return true;
    });
  }, [state.measurements, activeSheet?.id, layers, reviewFilter]);

  const sheetClouds = useMemo(
    () => revisionClouds.filter((c) => c.sheet_id === activeSheet?.id),
    [revisionClouds, activeSheet?.id]
  );

  const measurementComments = useMemo(
    () =>
      comments.filter(
        (c) =>
          c.measurement_id === selectedId ||
          (!c.measurement_id && c.sheet_id === activeSheet?.id && !selectedId)
      ),
    [comments, selectedId, activeSheet?.id]
  );

  const reviewStats = useMemo(
    () => computeReviewStats(state.measurements),
    [state.measurements]
  );

  const lockedLayerIds = useMemo(
    () => new Set(layers.filter((l) => l.is_locked).map((l) => l.id)),
    [layers]
  );

  const assignedBoqId = useMemo(() => {
    if (!selectedId) return null;
    return links.find((l) => l.measurement_id === selectedId)?.boq_id ?? null;
  }, [links, selectedId]);

  const boqLabels = useMemo(() => {
    const map: Record<string, string> = {};
    for (const b of boqOptions) {
      map[b.id] = `${b.item_code}`;
    }
    return map;
  }, [boqOptions]);

  const ppm = activeSheet?.pixels_per_meter ?? null;

  useEffect(() => {
    if (!highlightMeasurementId) return;
    const m = state.measurements.find((x) => x.id === highlightMeasurementId);
    if (!m) return;
    setSelectedIds([m.id]);
    setActiveSheetId(m.sheet_id);
    setHoveredId(m.id);
    setStatus('Highlighted from BOQ reverse navigation');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightMeasurementId]);

  useEffect(() => {
    if (!highlightBoqId || highlightMeasurementId) return;
    const linked = links.filter((l) => l.boq_id === highlightBoqId);
    if (linked[0]) {
      const m = state.measurements.find(
        (x) => x.id === linked[0].measurement_id
      );
      if (m) {
        setSelectedIds(linked.map((l) => l.measurement_id));
        setActiveSheetId(m.sheet_id);
        setHoveredId(m.id);
        setStatus(`Highlighted ${linked.length} measurement(s) for BOQ`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightBoqId]);

  const refreshBoqIntegration = async () => {
    const [dash, issues] = await Promise.all([
      getTakeoffBoqDashboard(projectId),
      validateTakeoffBoqLinks(projectId),
    ]);
    setBoqDashboard(dash);
    setValidationIssues(issues);
  };

  const handleAssignBoq = (boqId: string | null) => {
    if (!selectedId || !canEdit) return;
    startTransition(async () => {
      if (!boqId) {
        const result = await unassignMeasurementFromBoq({
          projectId,
          measurementId: selectedId,
        });
        if (!result.success) {
          setError(result.error ?? 'Unassign failed');
          return;
        }
        setLinks((prev) =>
          prev.filter((l) => l.measurement_id !== selectedId)
        );
        setBoqSyncStatus('Unassigned from BOQ');
      } else {
        const result = await assignMeasurementToBoq({
          projectId,
          measurementId: selectedId,
          boqId,
        });
        if (!result.success || !result.link) {
          setError(result.error ?? 'Assign failed');
          return;
        }
        setLinks((prev) => [
          ...prev.filter((l) => l.measurement_id !== selectedId),
          result.link!,
        ]);
        setBoqSyncStatus(
          result.syncedQuantity != null
            ? `BOQ qty synced → ${result.syncedQuantity}`
            : 'Assigned to BOQ'
        );
      }
      await refreshBoqIntegration();
    });
  };

  const previewTool = isLineLike(tool) ? 'line' : tool;
  const liveLabel = livePreviewLabel(
    previewTool === 'calibrate' ? 'line' : previewTool,
    draft.points,
    cursor,
    ppm
  );

  useEffect(() => {
    if (!activeDrawingId) {
      setPdfReady(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        const res = await fetch(
          `/api/projects/${projectId}/takeoff/drawings/${activeDrawingId}/pdf`
        );
        if (!res.ok) throw new Error('Failed to load PDF');
        const buf = await res.arrayBuffer();
        const doc = await pdfjs.getDocument({ data: buf }).promise;
        if (cancelled) return;
        pdfDocRef.current = doc;
        setPdfReady(true);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'PDF load failed');
          setPdfReady(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeDrawingId, projectId]);

  const renderPage = useCallback(async () => {
    const doc = pdfDocRef.current as {
      getPage: (n: number) => Promise<{
        getViewport: (opts: { scale: number; rotation: number }) => {
          width: number;
          height: number;
        };
        render: (opts: {
          canvasContext: CanvasRenderingContext2D;
          viewport: { width: number; height: number };
        }) => { promise: Promise<void> };
      }>;
    } | null;
    const canvas = canvasRef.current;
    if (!doc || !canvas || !activeSheet) return;
    const page = await doc.getPage(activeSheet.sheet_index + 1);
    const viewport = page.getViewport({
      scale: zoom,
      rotation: activeSheet.rotation_degrees,
    });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    setPageSize({ width: viewport.width, height: viewport.height });
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    await page.render({ canvasContext: ctx, viewport }).promise;

    if (!thumbSaved.current.has(activeSheet.id) && canEdit) {
      try {
        const thumb = document.createElement('canvas');
        const tw = 64;
        const th = Math.round((viewport.height / viewport.width) * tw) || 80;
        thumb.width = tw;
        thumb.height = th;
        const tctx = thumb.getContext('2d');
        if (tctx) {
          tctx.drawImage(canvas, 0, 0, tw, th);
          const dataUrl = thumb.toDataURL('image/jpeg', 0.6);
          thumbSaved.current.add(activeSheet.id);
          void updateSheetMeta({
            projectId,
            sheetId: activeSheet.id,
            thumbnailBase64: dataUrl,
          }).then(() => {
            setSheets((prev) =>
              prev.map((s) =>
                s.id === activeSheet.id
                  ? { ...s, thumbnail_base64: dataUrl }
                  : s
              )
            );
          });
        }
      } catch {
        // thumbnail best-effort
      }
    }
  }, [activeSheet, zoom, canEdit, projectId]);

  useEffect(() => {
    if (pdfReady) void renderPage();
  }, [pdfReady, renderPage, activeSheetId]);

  const drawOverlay = useCallback(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    overlay.width = pageSize.width;
    overlay.height = pageSize.height;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    const editTarget =
      tool === 'select' && selectedIds.length === 1
        ? visibleMeasurements.find((m) => m.id === selectedIds[0]) ?? null
        : null;
    drawTakeoffOverlay({
      ctx,
      width: pageSize.width,
      height: pageSize.height,
      zoom,
      measurements: visibleMeasurements,
      layers,
      selectedIds,
      hoveredId,
      showLabels,
      draftTool: previewTool,
      draftPoints: draft.points,
      draftCursor: cursor,
      draftColor: measureMeta.color || activeLayer?.color || '#2563eb',
      boxSelect,
      editHandlesFor: editTarget,
      snap: snapEnabled ? snap : null,
      revisionClouds: sheetClouds,
    });
  }, [
    pageSize,
    visibleMeasurements,
    layers,
    draft.points,
    cursor,
    activeLayer?.color,
    measureMeta.color,
    previewTool,
    zoom,
    selectedIds,
    boxSelect,
    tool,
    hoveredId,
    showLabels,
    snap,
    snapEnabled,
    sheetClouds,
  ]);

  useEffect(() => {
    drawOverlay();
  }, [drawOverlay]);

  const toPagePoint = (
    event: React.MouseEvent<HTMLCanvasElement>
  ): TakeoffPoint => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / zoom,
      y: (event.clientY - rect.top) / zoom,
    };
  };

  const pushHistory = (label: string, next: LocalState, prev: LocalState) => {
    historyRef.current.push({ label, undo: () => prev, redo: () => next }, prev);
    setState(next);
    setHistoryTick((t) => t + 1);
  };

  const resolveLayerId = (layerName?: string) => {
    if (layerName) {
      const found = layers.find(
        (l) => l.name.toLowerCase() === layerName.toLowerCase()
      );
      if (found) return found.id;
    }
    return activeLayer?.id ?? null;
  };

  const finishMeasurement = (
    geometry: TakeoffGeometry,
    measureTool: TakeoffMeasureTool
  ) => {
    if (!canEdit || !activeSheet) return;
    const layerId = resolveLayerId(activePreset?.layer_name);
    if (layerId && lockedLayerIds.has(layerId)) {
      setError('Active layer is locked');
      return;
    }
    const prev = state;
    startTransition(async () => {
      const result = await createTakeoffMeasurement({
        projectId,
        sheetId: activeSheet.id,
        layerId,
        toolType: measureTool,
        color: measureMeta.color || activeLayer?.color || '#2563eb',
        geometry,
        name: measureMeta.name || activePreset?.name || measureTool,
        discipline: measureMeta.discipline || activePreset?.discipline || null,
        unit: measureMeta.unit || activePreset?.unit || 'm',
        presetKey: measureMeta.presetKey,
        pixelsPerMeter: activeSheet.pixels_per_meter,
        scaleId: activeSheet.scales.find((s) => s.is_active)?.id ?? null,
        textContent: geometry.text,
      });
      if (!result.success || !result.measurement) {
        setError(result.error ?? 'Failed to save measurement');
        return;
      }
      const next = { measurements: [...prev.measurements, result.measurement] };
      pushHistory(`Add ${measureTool}`, next, prev);
      setDraft(emptyDraft());
      setCursor(null);
      setSelectedIds([result.measurement.id]);
      setStatus(`${result.measurement.name ?? measureTool} saved · ${livePreviewLabel(measureTool, result.measurement.geometry.points ?? [], null, ppm)}`);
    });
  };

  const persistEdited = (
    prev: LocalState,
    nextMeasurements: TakeoffMeasurement[],
    label: string
  ) => {
    const next = { measurements: nextMeasurements };
    pushHistory(label, next, prev);
    startTransition(async () => {
      for (const m of nextMeasurements) {
        const before = prev.measurements.find((x) => x.id === m.id);
        if (!before || before === m) continue;
        if (JSON.stringify(before.geometry) === JSON.stringify(m.geometry))
          continue;
        if (m.id.startsWith('local-')) continue;
        await persistTakeoffMeasurementGeometry({
          projectId,
          measurement: m,
        });
      }
    });
  };

  const applyLocalEdit = (
    updater: (list: TakeoffMeasurement[]) => TakeoffMeasurement[],
    label: string
  ) => {
    const prev = state;
    const nextList = updater(prev.measurements);
    persistEdited(prev, nextList, label);
  };

  const deleteSelected = () => {
    if (!canEdit || selectedIds.length === 0) return;
    const prev = state;
    const ids = new Set(selectedIds);
    startTransition(async () => {
      for (const id of selectedIds) {
        if (!id.startsWith('local-')) {
          await softDeleteTakeoffMeasurement({
            projectId,
            measurementId: id,
          });
        }
      }
      pushHistory('Delete', {
        measurements: prev.measurements.filter((m) => !ids.has(m.id)),
      }, prev);
      setSelectedIds([]);
    });
  };

  const copySelected = () => {
    const copies = state.measurements.filter((m) => selectedIds.includes(m.id));
    setClipboard(copies);
    setStatus(`Copied ${copies.length} measurement(s)`);
  };

  const pasteClipboard = () => {
    if (!canEdit || !activeSheet || clipboard.length === 0) return;
    const dupes = duplicateMeasurements(clipboard, 24);
    const prev = state;
    startTransition(async () => {
      const created: TakeoffMeasurement[] = [];
      for (const d of dupes) {
        const result = await createTakeoffMeasurement({
          projectId,
          sheetId: activeSheet.id,
          layerId: d.layer_id,
          toolType: d.tool_type,
          color: d.color,
          geometry: d.geometry,
          name: d.name,
          discipline: d.discipline,
          unit: d.unit,
          presetKey: d.preset_key,
          notes: d.notes ?? undefined,
          pixelsPerMeter: activeSheet.pixels_per_meter ?? d.pixels_per_meter,
          scaleId: activeSheet.scales.find((s) => s.is_active)?.id ?? null,
        });
        if (result.measurement) created.push(result.measurement);
      }
      if (created.length === 0) {
        setError('Paste failed');
        return;
      }
      pushHistory('Paste', {
        measurements: [...prev.measurements, ...created],
      }, prev);
      setSelectedIds(created.map((m) => m.id));
      setStatus(`Pasted ${created.length}`);
    });
  };

  const onOverlayMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = toPagePoint(event);

    if (tool === 'pan' || event.button === 1) {
      setIsPanning(true);
      panStart.current = {
        x: event.clientX,
        y: event.clientY,
        panX: pan.x,
        panY: pan.y,
      };
      return;
    }

    if (!canEdit) return;

    if (tool === 'select') {
      const single =
        selectedIds.length === 1
          ? visibleMeasurements.find((m) => m.id === selectedIds[0])
          : null;
      if (single) {
        const pts =
          single.tool_type === 'circle' && single.geometry.center
            ? [
                single.geometry.center,
                ...(single.geometry.points?.slice(1) ?? [
                  {
                    x:
                      single.geometry.center.x + (single.geometry.radius ?? 0),
                    y: single.geometry.center.y,
                  },
                ]),
              ]
            : geometryPoints(single.geometry, single.tool_type);
        const vIdx = hitTestVertex(pts, pt);
        if (vIdx >= 0) {
          dragRef.current = {
            kind: 'vertex',
            id: single.id,
            vertexIndex: vIdx,
            start: pt,
            originMeasurements: state.measurements,
          };
          return;
        }
      }

      const hit = [...visibleMeasurements]
        .reverse()
        .find((m) => {
          const pts = geometryPoints(m.geometry, m.tool_type);
          return (
            hitTestVertex(pts, pt) >= 0 ||
            hitTestEdge(
              pts,
              pt,
              m.tool_type === 'area' || m.tool_type === 'rectangle'
            ) != null ||
            (m.tool_type === 'circle' &&
              m.geometry.center &&
              Math.abs(
                distance(pt, m.geometry.center) - (m.geometry.radius ?? 0)
              ) <= SNAP_THRESHOLD_PX)
          );
        });

      if (hit && !event.ctrlKey && !event.metaKey) {
        setSelectedIds([hit.id]);
        dragRef.current = {
          kind: 'move',
          start: pt,
          originMeasurements: state.measurements,
        };
        return;
      }

      // box select start
      dragRef.current = { kind: 'box', start: pt };
      setBoxSelect({ a: pt, b: pt });
      if (!event.ctrlKey && !event.metaKey) {
        // defer clear until mouseup if it's a click-hit
      }
      return;
    }

    if (tool === 'rectangle' || tool === 'revision-cloud') {
      dragRef.current = { kind: 'rect', start: pt };
      setDraft({
        ...emptyDraft(),
        mode: tool === 'revision-cloud' ? 'drag-rect' : 'drag-rect',
        points: [pt],
        anchor: pt,
      });
      setCursor(pt);
      setStatus(
        tool === 'revision-cloud'
          ? 'Drag to place revision cloud'
          : 'Drag to size rectangle'
      );
    }
  };

  const onOverlayMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = toPagePoint(event);

    if (isPanning && panStart.current) {
      setPan({
        x: panStart.current.panX + (event.clientX - panStart.current.x),
        y: panStart.current.panY + (event.clientY - panStart.current.y),
      });
      return;
    }

    if (dragRef.current?.kind === 'box') {
      setBoxSelect({ a: dragRef.current.start, b: pt });
      return;
    }

    if (dragRef.current?.kind === 'rect') {
      setCursor(pt);
      setDraft((d) => ({ ...d, points: [dragRef.current!.start], cursor: pt }));
      setStatus(
        livePreviewLabel('rectangle', [dragRef.current.start], pt, ppm)
      );
      return;
    }

    if (dragRef.current?.kind === 'vertex' && dragRef.current.id != null) {
      const id = dragRef.current.id;
      const idx = dragRef.current.vertexIndex ?? 0;
      setState((s) => ({
        measurements: s.measurements.map((m) =>
          m.id === id ? editVertex(m, idx, pt) : m
        ),
      }));
      setStatus('Moving point…');
      return;
    }

    if (dragRef.current?.kind === 'move' && dragRef.current.originMeasurements) {
      const dx = pt.x - dragRef.current.start.x;
      const dy = pt.y - dragRef.current.start.y;
      const origin = dragRef.current.originMeasurements;
      setState({
        measurements: transformSelected(
          origin,
          selectedIds,
          'translate',
          dx,
          dy
        ),
      });
      setStatus('Moving…');
      return;
    }

    // hover highlight (select / pan idle)
    if (tool === 'select' || tool === 'pan') {
      const hit = [...visibleMeasurements]
        .reverse()
        .find((m) => hitTestMeasurement(m, pt));
      setHoveredId(hit?.id ?? null);
    }

    // snap engine
    let working = pt;
    if (
      snapEnabled &&
      canEdit &&
      tool !== 'pan' &&
      tool !== 'select' &&
      tool !== 'text'
    ) {
      const draftFrom = draft.points.at(-1) ?? null;
      const result = snapCursor(
        pt,
        visibleMeasurements,
        draftFrom,
        snapModes
      );
      setSnap(result);
      if (result) {
        working = result.point;
        setStatus(`Snap: ${snapKindLabel(result.kind)}`);
      } else {
        setSnap(null);
      }
    } else {
      setSnap(null);
    }

    // live draft preview
    if (
      isLineLike(tool) ||
      tool === 'area' ||
      tool === 'circle' ||
      tool === 'calibrate' ||
      tool === 'line'
    ) {
      let snapped = working;
      if (isLineLike(tool) && draft.points.length > 0 && !snap) {
        snapped = resolveLinePoint(draft.points, working, true);
        if (
          distance(working, draft.points[draft.points.length - 1]) >
          SNAP_THRESHOLD_PX
        ) {
          snapped = working;
        }
      }
      if (
        tool === 'area' &&
        draft.points.length >= 3 &&
        shouldAutoClose(draft.points, snapped)
      ) {
        snapped = draft.points[0];
        setStatus('Click to close polygon');
      } else if (!snap) {
        const label = livePreviewLabel(
          isLineLike(tool) ? 'line' : tool === 'calibrate' ? 'line' : tool,
          draft.points,
          snapped,
          ppm
        );
        if (label) setStatus(label);
      }
      setCursor(snapped);
    } else if (tool === 'revision-cloud' && draft.points[0]) {
      setCursor(working);
    }
  };

  const onOverlayMouseUp = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = toPagePoint(event);

    if (isPanning) {
      setIsPanning(false);
      panStart.current = null;
      return;
    }

    if (dragRef.current?.kind === 'box' && boxSelect) {
      const dx = Math.abs(boxSelect.b.x - boxSelect.a.x);
      const dy = Math.abs(boxSelect.b.y - boxSelect.a.y);
      const additive = event.ctrlKey || event.metaKey;
      if (dx < 3 && dy < 3) {
        setSelectedIds(
          selectByHit(visibleMeasurements, pt, additive, selectedIds)
        );
      } else {
        setSelectedIds(
          selectByBox(
            visibleMeasurements,
            boxSelect.a,
            boxSelect.b,
            additive,
            selectedIds
          )
        );
      }
      setBoxSelect(null);
      dragRef.current = null;
      return;
    }

    if (dragRef.current?.kind === 'rect' && canEdit) {
      const start = dragRef.current.start;
      dragRef.current = null;
      if (distance(start, pt) < 3) {
        setDraft(emptyDraft());
        setCursor(null);
        return;
      }
      if (tool === 'revision-cloud' && activeSheet) {
        const cloudPts = buildRevisionCloud(start, pt);
        setDraft(emptyDraft());
        setCursor(null);
        startTransition(async () => {
          const result = await createTakeoffRevisionCloud({
            projectId,
            sheetId: activeSheet.id,
            geometry: { points: cloudPts },
            label: 'Rev',
          });
          if (!result.success || !result.cloud) {
            setError(result.error ?? 'Revision cloud failed');
            return;
          }
          setRevisionClouds((prev) => [...prev, result.cloud!]);
          setStatus('Revision cloud added');
        });
        return;
      }
      finishMeasurement({ points: [start, pt] }, 'rectangle');
      return;
    }

    if (dragRef.current?.kind === 'vertex' || dragRef.current?.kind === 'move') {
      const prev: LocalState = {
        measurements: dragRef.current.originMeasurements ?? state.measurements,
      };
      const next = state;
      pushHistory(
        dragRef.current.kind === 'vertex' ? 'Move point' : 'Move',
        next,
        prev
      );
      startTransition(async () => {
        for (const m of next.measurements) {
          const before = prev.measurements.find((x) => x.id === m.id);
          if (!before) continue;
          if (JSON.stringify(before.geometry) === JSON.stringify(m.geometry))
            continue;
          await persistTakeoffMeasurementGeometry({
            projectId,
            measurement: m,
          });
        }
        setStatus('Measurement updated');
      });
      dragRef.current = null;
      return;
    }

    dragRef.current = null;
  };

  const onOverlayClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (
      tool === 'pan' ||
      tool === 'rectangle' ||
      tool === 'revision-cloud' ||
      tool === 'select'
    ) {
      return;
    }
    if (!canEdit) return;
    // ignore click that followed a drag
    if (dragRef.current) return;

    let pt = cursor ?? toPagePoint(event);

    if (tool === 'count') {
      const activeCount =
        selected && selected.tool_type === 'count' ? selected : null;
      if (activeCount && (event.shiftKey || selectedIds.length === 1)) {
        const prev = state;
        const updated = appendCountMarker(activeCount, pt);
        persistEdited(
          prev,
          prev.measurements.map((m) =>
            m.id === activeCount.id ? updated : m
          ),
          'Add count marker'
        );
        setStatus(
          `Count group · ${updated.count_value} markers`
        );
        return;
      }
      finishMeasurement({ points: [pt] }, 'count');
      return;
    }

    if (tool === 'text') {
      const text = window.prompt('Annotation text');
      if (!text) return;
      finishMeasurement({ points: [pt], text }, 'text');
      return;
    }

    if (tool === 'circle') {
      if (draft.points.length === 0) {
        setDraft({ ...emptyDraft(), mode: 'circle', points: [pt] });
        setStatus('Click to set radius');
        return;
      }
      const center = draft.points[0];
      const r = distance(center, pt);
      finishMeasurement(
        { center, radius: r, points: [center, pt] },
        'circle'
      );
      return;
    }

    if (tool === 'calibrate') {
      if (draft.points.length === 0) {
        setDraft({ ...emptyDraft(), mode: 'calibrate', points: [pt] });
        setStatus('Click end of known length');
        return;
      }
      const pts = [draft.points[0], pt];
      const known = Number(calibLength);
      const px = distance(pts[0], pts[1]);
      const nextPpm = pixelsPerMeterFromCalibration(px, known);
      if (!nextPpm || !activeSheet) {
        setError('Enter a valid known length (meters)');
        setDraft(emptyDraft());
        return;
      }
      startTransition(async () => {
        const result = await saveSheetCalibration({
          projectId,
          sheetId: activeSheet.id,
          pixelsPerMeter: nextPpm,
          scaleName: `Metric ${known} m`,
        });
        if (!result.success || !result.sheet) {
          setError(result.error ?? 'Calibration failed');
          return;
        }
        setSheets((prev) =>
          prev.map((s) => (s.id === result.sheet!.id ? result.sheet! : s))
        );
        setDraft(emptyDraft());
        setCursor(null);
        setStatus(`Calibrated ${nextPpm.toFixed(2)} px/m`);
        setTool('line');
      });
      return;
    }

    if (isLineLike(tool) || tool === 'area') {
      if (isLineLike(tool) && draft.points.length > 0) {
        pt = resolveLinePoint(draft.points, pt, true);
        if (distance(toPagePoint(event), draft.points[draft.points.length - 1]) > SNAP_THRESHOLD_PX) {
          pt = toPagePoint(event);
        }
      }
      if (
        tool === 'area' &&
        draft.points.length >= 3 &&
        shouldAutoClose(draft.points, pt)
      ) {
        finishMeasurement({ points: draft.points }, 'area');
        return;
      }
      setDraft((d) => ({
        ...d,
        mode: tool === 'area' ? 'area' : 'line',
        points: [...d.points, pt],
      }));
      setStatus(
        tool === 'area'
          ? 'Click vertices · near first point or Enter to close'
          : 'Click segments · Enter / double-click to finish'
      );
    }
  };

  const finishLineOrArea = () => {
    if (!canEdit) return;
    if (isLineLike(tool) && draft.points.length >= 2) {
      finishMeasurement({ points: draft.points }, 'line');
      return;
    }
    if (tool === 'area' && draft.points.length >= 3) {
      finishMeasurement({ points: draft.points }, 'area');
    }
  };

  const onDoubleClick = () => {
    if (tool === 'select' && selected && canEdit) {
      // insert point on nearest edge
      const pts = geometryPoints(selected.geometry, selected.tool_type);
      if (!cursor) return;
      const edge = hitTestEdge(
        pts,
        cursor,
        selected.tool_type === 'area' || selected.tool_type === 'rectangle'
      );
      if (!edge) return;
      applyLocalEdit(
        (list) =>
          list.map((m) =>
            m.id === selected.id
              ? insertVertex(m, edge.insertAfter, edge.point)
              : m
          ),
        'Insert point'
      );
      return;
    }
    finishLineOrArea();
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }
      const key = event.key.toLowerCase();
      const mod = event.ctrlKey || event.metaKey;

      if (mod && key === 'z' && !event.shiftKey) {
        event.preventDefault();
        if (historyRef.current.canUndo) {
          setState((s) => historyRef.current.undo(s));
          setHistoryTick((t) => t + 1);
        }
        return;
      }
      if (mod && (key === 'y' || (key === 'z' && event.shiftKey))) {
        event.preventDefault();
        if (historyRef.current.canRedo) {
          setState((s) => historyRef.current.redo(s));
          setHistoryTick((t) => t + 1);
        }
        return;
      }
      if (mod && key === 'c') {
        event.preventDefault();
        copySelected();
        return;
      }
      if (mod && key === 'v') {
        event.preventDefault();
        pasteClipboard();
        return;
      }
      if (mod && key === 'd') {
        event.preventDefault();
        copySelected();
        pasteClipboard();
        return;
      }
      if (mod && event.shiftKey && key === 'r') {
        event.preventDefault();
        if (selectedIds.length && canEdit) {
          applyLocalEdit(
            (list) => transformSelected(list, selectedIds, 'rotate', 15),
            'Rotate'
          );
        }
        return;
      }
      if (key === ']' && selectedIds.length && canEdit) {
        event.preventDefault();
        applyLocalEdit(
          (list) => transformSelected(list, selectedIds, 'scale', 1.1),
          'Scale up'
        );
        return;
      }
      if (key === '[' && selectedIds.length && canEdit) {
        event.preventDefault();
        applyLocalEdit(
          (list) => transformSelected(list, selectedIds, 'scale', 1 / 1.1),
          'Scale down'
        );
        return;
      }
      if (key === 'enter') {
        finishLineOrArea();
        return;
      }
      if (key === 'escape') {
        setDraft(emptyDraft());
        setCursor(null);
        setBoxSelect(null);
        return;
      }
      if ((key === 'delete' || key === 'backspace') && canEdit) {
        event.preventDefault();
        if (
          tool === 'select' &&
          selected &&
          selectedIds.length === 1 &&
          event.shiftKey
        ) {
          // Shift+Delete removes last vertex
          const pts = selected.geometry.points ?? [];
          const result = deleteVertex(selected, pts.length - 1);
          if (result === null) {
            deleteSelected();
          } else {
            applyLocalEdit(
              (list) =>
                list.map((m) => (m.id === selected.id ? result : m)),
              'Delete point'
            );
          }
          return;
        }
        deleteSelected();
        return;
      }

      if (mod) return;

      const map: Record<string, TakeoffToolType> = {
        v: 'select',
        h: 'pan',
        l: 'line',
        p: 'polyline',
        a: 'area',
        r: 'rectangle',
        c: 'circle',
        n: 'count',
        t: 'text',
        k: 'calibrate',
        m: 'revision-cloud',
      };
      if (map[key]) {
        setTool(map[key]);
        setDraft(emptyDraft());
        setCursor(null);
      }
      if (key === '=' || key === '+') setZoom((z) => Math.min(4, z * 1.15));
      if (key === '-') setZoom((z) => Math.max(0.25, z / 1.15));
      if (key === '0') {
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tool,
    draft.points,
    selectedIds,
    state,
    canEdit,
    clipboard,
    selected,
  ]);

  const onUpload = (fileList: FileList | null, discipline: string) => {
    const file = fileList?.[0];
    if (!file || !canEdit) return;
    const formData = new FormData();
    formData.set('file', file);
    formData.set('title', file.name.replace(/\.pdf$/i, ''));
    formData.set('discipline', discipline);
    formData.set('page_count', '1');
    setError(null);
    startTransition(async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        const buf = await file.arrayBuffer();
        const doc = await pdfjs.getDocument({ data: buf }).promise;
        formData.set('page_count', String(doc.numPages));
      } catch {
        formData.set('page_count', '1');
      }
      const result = await uploadTakeoffDrawing(projectId, formData);
      if (!result.success || !result.drawing) {
        setError(result.error ?? 'Upload failed');
        return;
      }
      setDrawings((prev) => [result.drawing!, ...prev]);
      setSheets((prev) => [...(result.sheets ?? []), ...prev]);
      setActiveDrawingId(result.drawing.id);
      setActiveSheetId(result.sheets?.[0]?.id ?? null);
      setStatus(`Uploaded ${result.drawing.title}`);
    });
  };

  const applyPreset = (preset: TakeoffPalettePreset) => {
    setActivePreset(preset);
    setTool(preset.tool);
    setMeasureMeta({
      name: preset.name,
      discipline: preset.discipline,
      unit: preset.unit,
      color: preset.color,
      presetKey: preset.key,
    });
    const layer = layers.find(
      (l) => l.name.toLowerCase() === preset.layer_name.toLowerCase()
    );
    if (layer) setActiveLayerId(layer.id);
    setDraft(emptyDraft());
    setStatus(`Preset: ${preset.group} / ${preset.name}`);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-background">
      <TakeoffPalette
        activePresetKey={activePreset?.key ?? null}
        onSelect={applyPreset}
        disabled={!canEdit}
      />
      <ReviewDashboard
        stats={reviewStats}
        filter={reviewFilter}
        onFilter={setReviewFilter}
      />
      <TakeoffBoqDashboard stats={boqDashboard} />
      <TakeoffBoqValidationPanel
        issues={validationIssues}
        onSelectMeasurement={(id) => {
          const m = state.measurements.find((x) => x.id === id);
          if (!m) return;
          setSelectedIds([id]);
          setActiveSheetId(m.sheet_id);
          setHoveredId(id);
        }}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex w-72 shrink-0 flex-col overflow-hidden border-r">
          <DrawingExplorer
            drawings={drawings}
            sheets={sheets}
            activeDrawingId={activeDrawingId}
            activeSheetId={activeSheetId}
            canEdit={canEdit}
            onSelectSheet={(drawingId, sheetId) => {
              setActiveDrawingId(drawingId);
              setActiveSheetId(sheetId);
              setSelectedIds([]);
              setDraft(emptyDraft());
            }}
            onUpload={onUpload}
          />
          <LayerManager
            layers={layers}
            canEdit={canEdit}
            onChange={(layerId, patch) => {
              setLayers((prev) =>
                prev.map((l) => (l.id === layerId ? { ...l, ...patch } : l))
              );
              startTransition(async () => {
                await updateTakeoffLayer({
                  projectId,
                  layerId,
                  patch,
                });
              });
            }}
          />
          <MeasurementPanel
            measurements={state.measurements}
            sheets={sheets}
            layers={layers}
            links={links}
            boqLabels={boqLabels}
            selectedId={selectedId}
            onSelect={(id) => {
              const m = state.measurements.find((x) => x.id === id);
              setSelectedIds([id]);
              if (m) setActiveSheetId(m.sheet_id);
            }}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-1 border-b px-2 py-1.5">
            {TOOLS.map((t) => {
              const Icon = t.icon;
              return (
                <Button
                  key={t.id}
                  type="button"
                  size="sm"
                  variant={tool === t.id ? 'default' : 'ghost'}
                  title={`${t.label}${t.shortcut ? ` (${t.shortcut})` : ''}`}
                  disabled={!canEdit && isMeasureTool(t.id)}
                  onClick={() => {
                    setTool(t.id);
                    setDraft(emptyDraft());
                    setCursor(null);
                  }}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              );
            })}
            <div className="mx-1 h-6 w-px bg-border" />
            <Button
              type="button"
              size="sm"
              variant={snapEnabled ? 'default' : 'ghost'}
              title="Toggle snap engine"
              onClick={() => setSnapEnabled((v) => !v)}
            >
              <Magnet className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant={showLabels ? 'default' : 'ghost'}
              title="Toggle measurement labels"
              onClick={() => setShowLabels((v) => !v)}
            >
              <Tag className="h-4 w-4" />
            </Button>
            <TakeoffExportMenu projectId={projectId} />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={!canEdit || selectedIds.length === 0}
              title={`Copy (${TAKEOFF_SHORTCUTS.copy})`}
              onClick={copySelected}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={!canEdit || selectedIds.length === 0}
              title={`Rotate 15° (${TAKEOFF_SHORTCUTS.rotate})`}
              onClick={() =>
                applyLocalEdit(
                  (list) => transformSelected(list, selectedIds, 'rotate', 15),
                  'Rotate'
                )
              }
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={!canEdit || selectedIds.length === 0}
              title={`Scale (${TAKEOFF_SHORTCUTS.scaleUp}/${TAKEOFF_SHORTCUTS.scaleDown})`}
              onClick={() =>
                applyLocalEdit(
                  (list) => transformSelected(list, selectedIds, 'scale', 1.1),
                  'Scale'
                )
              }
            >
              <Scaling className="h-4 w-4" />
            </Button>
            <div className="mx-1 h-6 w-px bg-border" />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setZoom((z) => Math.min(4, z * 1.15))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setZoom((z) => Math.max(0.25, z / 1.15))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={!canEdit || !activeSheet}
              onClick={() => {
                if (!activeSheet) return;
                const next = ((activeSheet.rotation_degrees + 90) % 360) as
                  | 0
                  | 90
                  | 180
                  | 270;
                startTransition(async () => {
                  await updateSheetRotation({
                    projectId,
                    sheetId: activeSheet.id,
                    rotationDegrees: next,
                  });
                  setSheets((prev) =>
                    prev.map((s) =>
                      s.id === activeSheet.id
                        ? { ...s, rotation_degrees: next }
                        : s
                    )
                  );
                });
              }}
              title="Rotate sheet 90°"
            >
              <RotateCw className="h-4 w-4 opacity-60" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={!historyRef.current.canUndo}
              onClick={() => {
                setState((s) => historyRef.current.undo(s));
                setHistoryTick((t) => t + 1);
              }}
              title={TAKEOFF_SHORTCUTS.undo}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={!historyRef.current.canRedo}
              onClick={() => {
                setState((s) => historyRef.current.redo(s));
                setHistoryTick((t) => t + 1);
              }}
              title={TAKEOFF_SHORTCUTS.redo}
            >
              <Redo2 className="h-4 w-4" />
            </Button>
            {tool === 'calibrate' ? (
              <div className="ml-2 flex items-center gap-1">
                <Label htmlFor="calib" className="text-xs">
                  Known (m)
                </Label>
                <Input
                  id="calib"
                  className="h-8 w-20"
                  value={calibLength}
                  onChange={(e) => setCalibLength(e.target.value)}
                />
              </div>
            ) : null}
            <span className="ml-auto max-w-[50%] truncate text-xs text-muted-foreground">
              {Math.round(zoom * 100)}%
              {ppm ? ` · ${ppm.toFixed(1)} px/m` : ' · Not calibrated'}
              {selectedIds.length > 1 ? ` · ${selectedIds.length} selected` : ''}
              {liveLabel ? ` · ${liveLabel}` : ''}
              {isPending ? ' · Saving…' : ''}
            </span>
          </div>

          <div className="relative min-h-0 flex-1 overflow-auto bg-neutral-200 dark:bg-neutral-900">
            <div style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}>
              <div className="relative inline-block shadow-md">
                <canvas ref={canvasRef} className="block bg-white" />
                <canvas
                  ref={overlayRef}
                  className={cn(
                    'absolute left-0 top-0',
                    tool === 'pan'
                      ? 'cursor-grab'
                      : tool === 'select'
                        ? 'cursor-default'
                        : 'cursor-crosshair'
                  )}
                  onMouseDown={onOverlayMouseDown}
                  onMouseMove={onOverlayMouseMove}
                  onMouseUp={onOverlayMouseUp}
                  onMouseLeave={() => {
                    setIsPanning(false);
                    panStart.current = null;
                    if (dragRef.current?.kind === 'box') {
                      setBoxSelect(null);
                      dragRef.current = null;
                    }
                  }}
                  onClick={onOverlayClick}
                  onDoubleClick={onDoubleClick}
                />
              </div>
            </div>
            {!activeDrawingId ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                Upload a PDF in the Drawing Explorer to start
              </div>
            ) : null}
          </div>

          {(error || status || boqSyncStatus) && (
            <div className="border-t px-3 py-1 text-xs">
              {error ? (
                <span className="text-destructive">{error}</span>
              ) : (
                <span className="text-muted-foreground">
                  {boqSyncStatus ? `${boqSyncStatus} · ` : ''}
                  {status}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex w-72 shrink-0 flex-col border-l">
          <TakeoffPropertiesPanel
            measurement={selected}
            layers={layers}
            sheet={activeSheet}
            canEdit={canEdit}
            selectionCount={selectedIds.length}
            boqOptions={boqOptions}
            assignedBoqId={assignedBoqId}
            onAssignBoq={handleAssignBoq}
            onChange={(patch) => {
              if (!selected || !canEdit) return;
              const prev = state;
              startTransition(async () => {
                const result = await updateTakeoffMeasurement({
                  projectId,
                  measurementId: selected.id,
                  patch,
                });
                if (!result.success || !result.measurement) {
                  setError(result.error ?? 'Update failed');
                  return;
                }
                const next = {
                  measurements: prev.measurements.map((m) =>
                    m.id === selected.id ? result.measurement! : m
                  ),
                };
                pushHistory('Update properties', next, prev);
              });
            }}
            onDeletePoint={() => {
              if (!selected || !canEdit) return;
              const pts = selected.geometry.points ?? [];
              if (pts.length === 0) return;
              const result = deleteVertex(selected, pts.length - 1);
              if (result === null) deleteSelected();
              else {
                applyLocalEdit(
                  (list) =>
                    list.map((m) => (m.id === selected.id ? result : m)),
                  'Delete point'
                );
              }
            }}
          />
          <CommentsPanel
            comments={measurementComments}
            canEdit={canEdit}
            measurementId={selectedId}
            onAdd={(body, parentId) => {
              if (!selectedId) return;
              startTransition(async () => {
                const result = await createTakeoffComment({
                  projectId,
                  body,
                  measurementId: selectedId,
                  sheetId: activeSheet?.id ?? null,
                  parentId: parentId ?? null,
                });
                if (result.comment) {
                  setComments((prev) => [...prev, result.comment!]);
                } else {
                  setError(result.error ?? 'Comment failed');
                }
              });
            }}
            onToggleResolved={(commentId, isResolved) => {
              startTransition(async () => {
                const result = await setTakeoffCommentResolved({
                  projectId,
                  commentId,
                  isResolved,
                });
                if (result.comment) {
                  setComments((prev) =>
                    prev.map((c) =>
                      c.id === commentId ? result.comment! : c
                    )
                  );
                }
              });
            }}
          />
        </div>
      </div>

      <TakeoffSummaryBar
        measurements={state.measurements}
        layers={layers}
      />
    </div>
  );
}
