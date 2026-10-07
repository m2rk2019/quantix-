'use server';

import ExcelJS from 'exceljs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

import { requireProvisionedUserProfile } from '@/lib/auth/session';
import { computeReviewStats } from '@/lib/takeoff/review';
import { createClient } from '@/lib/supabase/server';
import type {
  TakeoffLayer,
  TakeoffMeasurement,
  TakeoffMeasureTool,
  TakeoffReviewStatus,
} from '@/types/takeoff';

export type TakeoffExportFormat = 'csv' | 'xlsx' | 'pdf' | 'report';

function mapRow(row: Record<string, unknown>): TakeoffMeasurement {
  return {
    id: String(row.id),
    project_id: String(row.project_id),
    sheet_id: String(row.sheet_id),
    layer_id: (row.layer_id as string | null) ?? null,
    takeoff_item_id: (row.takeoff_item_id as string | null) ?? null,
    name: (row.name as string | null) ?? null,
    discipline: (row.discipline as string | null) ?? null,
    unit: String(row.unit ?? 'm'),
    preset_key: (row.preset_key as string | null) ?? null,
    tool_type: row.tool_type as TakeoffMeasureTool,
    color: String(row.color ?? '#2563eb'),
    geometry: (row.geometry ?? {}) as TakeoffMeasurement['geometry'],
    length_m: row.length_m != null ? Number(row.length_m) : null,
    area_m2: row.area_m2 != null ? Number(row.area_m2) : null,
    count_value: row.count_value != null ? Number(row.count_value) : null,
    text_content: (row.text_content as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    scale_id: (row.scale_id as string | null) ?? null,
    pixels_per_meter:
      row.pixels_per_meter != null ? Number(row.pixels_per_meter) : null,
    review_status: (row.review_status as TakeoffReviewStatus) ?? 'draft',
    created_by: (row.created_by as string | null) ?? null,
    created_by_name: (row.created_by_name as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

async function loadExportData(projectId: string): Promise<{
  measurements: TakeoffMeasurement[];
  layers: TakeoffLayer[];
  projectName: string;
}> {
  const supabase = await createClient();
  const [{ data: project }, { data: meas }, { data: layers }] =
    await Promise.all([
      supabase
        .from('projects')
        .select('project_name')
        .eq('id', projectId)
        .maybeSingle(),
      supabase
        .from('takeoff_measurements')
        .select(
          'id, project_id, sheet_id, layer_id, takeoff_item_id, name, discipline, unit, preset_key, tool_type, color, geometry, length_m, area_m2, count_value, text_content, notes, scale_id, pixels_per_meter, review_status, created_by, created_by_name, created_at, updated_at'
        )
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true }),
      supabase
        .from('takeoff_layers')
        .select(
          'id, project_id, name, color, is_visible, is_locked, opacity, sort_order, is_system'
        )
        .eq('project_id', projectId)
        .is('deleted_at', null),
    ]);

  return {
    projectName: project?.project_name ?? 'Project',
    measurements: (meas ?? []).map((r) =>
      mapRow(r as Record<string, unknown>)
    ),
    layers: (layers ?? []).map((l) => ({
      ...(l as TakeoffLayer),
      opacity:
        (l as { opacity?: number }).opacity != null
          ? Number((l as { opacity?: number }).opacity)
          : 1,
    })),
  };
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

function buildCsv(
  measurements: TakeoffMeasurement[],
  layers: TakeoffLayer[]
): string {
  const layerName = (id: string | null) =>
    layers.find((l) => l.id === id)?.name ?? '';
  const header = [
    'Name',
    'Layer',
    'Discipline',
    'Tool',
    'Unit',
    'Length_m',
    'Area_m2',
    'Count',
    'Status',
    'Notes',
    'Created_By',
    'Created_At',
  ];
  const rows = measurements.map((m) =>
    [
      m.name ?? '',
      layerName(m.layer_id),
      m.discipline ?? '',
      m.tool_type,
      m.unit,
      m.length_m?.toFixed(4) ?? '',
      m.area_m2?.toFixed(4) ?? '',
      m.count_value != null ? String(m.count_value) : '',
      m.review_status,
      m.notes ?? '',
      m.created_by_name ?? '',
      m.created_at,
    ]
      .map((c) => csvEscape(String(c)))
      .join(',')
  );
  return [header.join(','), ...rows].join('\n');
}

async function buildExcel(
  projectName: string,
  measurements: TakeoffMeasurement[],
  layers: TakeoffLayer[],
  reportMode: boolean
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Quantix Takeoff';
  const sheet = wb.addWorksheet(reportMode ? 'Takeoff Report' : 'Measurements');
  sheet.columns = [
    { header: 'Name', key: 'name', width: 28 },
    { header: 'Layer', key: 'layer', width: 16 },
    { header: 'Discipline', key: 'discipline', width: 14 },
    { header: 'Tool', key: 'tool', width: 12 },
    { header: 'Unit', key: 'unit', width: 8 },
    { header: 'Length (m)', key: 'length', width: 12 },
    { header: 'Area (m²)', key: 'area', width: 12 },
    { header: 'Count', key: 'count', width: 8 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Notes', key: 'notes', width: 28 },
  ];
  sheet.getRow(1).font = { bold: true };

  const layerName = (id: string | null) =>
    layers.find((l) => l.id === id)?.name ?? '';

  for (const m of measurements) {
    sheet.addRow({
      name: m.name ?? '',
      layer: layerName(m.layer_id),
      discipline: m.discipline ?? '',
      tool: m.tool_type,
      unit: m.unit,
      length: m.length_m,
      area: m.area_m2,
      count: m.count_value,
      status: m.review_status,
      notes: m.notes ?? '',
    });
  }

  if (reportMode) {
    const summary = wb.addWorksheet('Review Summary');
    const stats = computeReviewStats(measurements);
    summary.addRow(['Project', projectName]);
    summary.addRow(['Generated', new Date().toISOString()]);
    summary.addRow([]);
    summary.addRow(['Metric', 'Value']);
    summary.addRow(['Total measurements', stats.total]);
    summary.addRow(['Pending review', stats.pending_review]);
    summary.addRow(['Draft', stats.draft]);
    summary.addRow(['Checked', stats.checked]);
    summary.addRow(['Approved', stats.approved]);
    summary.addRow(['Rejected', stats.rejected]);
    summary.getRow(4).font = { bold: true };

    const byLayer = wb.addWorksheet('By Layer');
    byLayer.addRow(['Layer', 'Count', 'Length_m', 'Area_m2']);
    byLayer.getRow(1).font = { bold: true };
    for (const layer of layers) {
      const subset = measurements.filter((m) => m.layer_id === layer.id);
      byLayer.addRow([
        layer.name,
        subset.length,
        subset.reduce((s, m) => s + (m.length_m ?? 0), 0),
        subset.reduce((s, m) => s + (m.area_m2 ?? 0), 0),
      ]);
    }
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

async function buildPdf(
  projectName: string,
  measurements: TakeoffMeasurement[],
  layers: TakeoffLayer[]
): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const pageWidth = 841.89;
  const pageHeight = 595.28;
  const margin = 36;
  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const draw = (text: string, bold = false, size = 9) => {
    if (y < margin + 20) {
      page = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
    const safe = text.replace(/[^\u0000-\u00ff]/g, '?');
    page.drawText(safe.slice(0, 140), {
      x: margin,
      y,
      size,
      font: bold ? fontBold : font,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= size + 4;
  };

  const stats = computeReviewStats(measurements);
  draw(`Quantix Takeoff Report — ${projectName}`, true, 14);
  draw(`Generated ${new Date().toLocaleString()}`);
  draw(
    `Total ${stats.total} · Pending ${stats.pending_review} · Approved ${stats.approved} · Rejected ${stats.rejected}`
  );
  y -= 8;
  draw(
    'Name | Layer | Tool | Length | Area | Count | Status',
    true,
    8
  );

  const layerName = (id: string | null) =>
    layers.find((l) => l.id === id)?.name ?? '-';

  for (const m of measurements) {
    draw(
      `${m.name ?? m.tool_type} | ${layerName(m.layer_id)} | ${m.tool_type} | ${m.length_m?.toFixed(2) ?? '-'} | ${m.area_m2?.toFixed(2) ?? '-'} | ${m.count_value ?? '-'} | ${m.review_status}`,
      false,
      8
    );
  }

  const bytes = await doc.save();
  return Buffer.from(bytes);
}

function toBase64(buf: Buffer): string {
  return buf.toString('base64');
}

export async function exportTakeoff(input: {
  projectId: string;
  format: TakeoffExportFormat;
}): Promise<{
  success: boolean;
  error?: string;
  filename?: string;
  mime?: string;
  base64?: string;
}> {
  try {
    await requireProvisionedUserProfile();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unauthorized',
    };
  }

  const { projectName, measurements, layers } = await loadExportData(
    input.projectId
  );
  const stamp = new Date().toISOString().slice(0, 10);
  const safeName = projectName.replace(/[^\w\-]+/g, '_').slice(0, 40);

  if (input.format === 'csv') {
    const csv = buildCsv(measurements, layers);
    return {
      success: true,
      filename: `${safeName}_takeoff_${stamp}.csv`,
      mime: 'text/csv;charset=utf-8',
      base64: toBase64(Buffer.from(csv, 'utf8')),
    };
  }

  if (input.format === 'xlsx' || input.format === 'report') {
    const buf = await buildExcel(
      projectName,
      measurements,
      layers,
      input.format === 'report'
    );
    return {
      success: true,
      filename: `${safeName}_takeoff_${input.format === 'report' ? 'report_' : ''}${stamp}.xlsx`,
      mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      base64: toBase64(buf),
    };
  }

  if (input.format === 'pdf') {
    const buf = await buildPdf(projectName, measurements, layers);
    return {
      success: true,
      filename: `${safeName}_takeoff_${stamp}.pdf`,
      mime: 'application/pdf',
      base64: toBase64(buf),
    };
  }

  return { success: false, error: 'Unknown format.' };
}
