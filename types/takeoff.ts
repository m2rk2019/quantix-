/**
 * Quantix V1.1 — Manual Quantity Takeoff types.
 * Phase 5 authorizes Takeoff ↔ BOQ quantity links (Import Engine still frozen).
 */

export type TakeoffToolType =
  | 'line'
  | 'polyline'
  | 'area'
  | 'rectangle'
  | 'circle'
  | 'count'
  | 'text'
  | 'pan'
  | 'calibrate'
  | 'select'
  | 'revision-cloud';

export type TakeoffMeasureTool = Exclude<
  TakeoffToolType,
  'pan' | 'calibrate' | 'select' | 'revision-cloud'
>;

export type TakeoffReviewStatus =
  | 'draft'
  | 'checked'
  | 'approved'
  | 'rejected';

export interface TakeoffPoint {
  x: number;
  y: number;
}

export interface TakeoffScale {
  id: string;
  name: string;
  pixels_per_meter: number;
  is_active: boolean;
}

export interface TakeoffGeometry {
  points?: TakeoffPoint[];
  center?: TakeoffPoint;
  radius?: number;
  text?: string;
  known_length_m?: number;
}

export interface TakeoffDrawing {
  id: string;
  project_id: string;
  title: string;
  original_filename: string;
  mime_type: string;
  file_size_bytes: number;
  page_count: number;
  revision_label: string | null;
  notes: string | null;
  discipline: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TakeoffSheet {
  id: string;
  drawing_id: string;
  project_id: string;
  sheet_index: number;
  sheet_name: string;
  discipline: string | null;
  rotation_degrees: 0 | 90 | 180 | 270;
  pixels_per_meter: number | null;
  scales: TakeoffScale[];
  thumbnail_base64: string | null;
  sort_order: number;
}

export interface TakeoffLayer {
  id: string;
  project_id: string;
  name: string;
  color: string;
  is_visible: boolean;
  is_locked: boolean;
  opacity: number;
  sort_order: number;
  is_system: boolean;
}

export interface TakeoffItem {
  id: string;
  project_id: string;
  layer_id: string | null;
  name: string;
  unit: string;
  notes: string | null;
}

export interface TakeoffMeasurement {
  id: string;
  project_id: string;
  sheet_id: string;
  layer_id: string | null;
  takeoff_item_id: string | null;
  name: string | null;
  discipline: string | null;
  unit: string;
  preset_key: string | null;
  tool_type: TakeoffMeasureTool;
  color: string;
  geometry: TakeoffGeometry;
  length_m: number | null;
  area_m2: number | null;
  count_value: number | null;
  text_content: string | null;
  notes: string | null;
  scale_id: string | null;
  pixels_per_meter: number | null;
  review_status: TakeoffReviewStatus;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface TakeoffRevisionCloud {
  id: string;
  project_id: string;
  sheet_id: string;
  label: string | null;
  color: string;
  geometry: TakeoffGeometry;
  notes: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface TakeoffComment {
  id: string;
  project_id: string;
  sheet_id: string | null;
  measurement_id: string | null;
  parent_id: string | null;
  body: string;
  is_resolved: boolean;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface TakeoffRevisionEntry {
  id: string;
  project_id: string;
  entity_type: string;
  entity_id: string | null;
  action: string;
  snapshot: Record<string, unknown>;
  actor_id: string | null;
  created_at: string;
}

/** Phase 5 — Project → WBS → BOQ ← Measurement */
export interface TakeoffBoqLink {
  id: string;
  project_id: string;
  wbs_id: string;
  boq_id: string;
  measurement_id: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_TAKEOFF_LAYERS: Array<{
  name: string;
  color: string;
  sort_order: number;
}> = [
  { name: 'Architectural', color: '#2563eb', sort_order: 1 },
  { name: 'Structural', color: '#dc2626', sort_order: 2 },
  { name: 'Civil', color: '#ca8a04', sort_order: 3 },
  { name: 'Plumbing', color: '#0891b2', sort_order: 4 },
  { name: 'Sanitary', color: '#0d9488', sort_order: 5 },
  { name: 'Mechanical', color: '#ea580c', sort_order: 6 },
  { name: 'Electrical', color: '#7c3aed', sort_order: 7 },
  { name: 'Fire Protection', color: '#e11d48', sort_order: 8 },
  { name: 'Landscaping', color: '#16a34a', sort_order: 9 },
];

export const MAX_TAKEOFF_PDF_BYTES = 25 * 1024 * 1024;
