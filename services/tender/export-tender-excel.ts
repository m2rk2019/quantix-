import ExcelJS from 'exceljs';

import type { TenderPackageSnapshot, TenderSectionId } from '@/types/tender';
import { TENDER_SECTION_LABELS } from '@/types/tender';

export async function buildTenderExcelBuffer(
  snapshot: TenderPackageSnapshot
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = snapshot.branding.company_name;
  workbook.created = new Date(snapshot.generated_at);

  const cover = workbook.addWorksheet('Cover');
  cover.addRow([snapshot.branding.company_name]);
  cover.addRow(['Tender Submission Package']);
  cover.addRow([snapshot.project.project_name]);
  cover.addRow([`Code: ${snapshot.project.project_code}`]);
  cover.addRow([`Client: ${snapshot.project.client_name}`]);
  cover.addRow([`Location: ${snapshot.project.location ?? '—'}`]);
  cover.addRow([]);
  cover.addRow([`Prepared by: ${snapshot.branding.prepared_by}`]);
  cover.addRow([`Checked by: ${snapshot.branding.checked_by}`]);
  cover.addRow([`Approved by: ${snapshot.branding.approved_by}`]);
  if (snapshot.branding.address) {
    cover.addRow([`Address: ${snapshot.branding.address}`]);
  }
  if (snapshot.branding.phone || snapshot.branding.email) {
    cover.addRow([
      `Contact: ${[snapshot.branding.phone, snapshot.branding.email].filter(Boolean).join(' · ')}`,
    ]);
  }

  for (const sectionId of snapshot.enabled_sections) {
    const payload = snapshot.sections[sectionId] as
      | Record<string, unknown>
      | undefined;
    if (!payload) continue;
    addSectionSheet(workbook, sectionId, payload);
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

function sheetName(sectionId: TenderSectionId): string {
  const label = TENDER_SECTION_LABELS[sectionId] ?? sectionId;
  return label.slice(0, 31);
}

function addSectionSheet(
  workbook: ExcelJS.Workbook,
  sectionId: TenderSectionId,
  payload: Record<string, unknown>
): void {
  const sheet = workbook.addWorksheet(sheetName(sectionId));
  sheet.addRow([TENDER_SECTION_LABELS[sectionId]]);

  if (sectionId === 'boq') {
    sheet.addRow([
      'Item Code',
      'Description',
      'Unit',
      'Qty',
      'Rate',
      'Amount',
      'WBS',
    ]);
    const items = Array.isArray(payload.items) ? payload.items : [];
    for (const row of items) {
      const item = row as Record<string, unknown>;
      sheet.addRow([
        item.item_code,
        item.description,
        item.unit,
        item.quantity,
        item.total_rate,
        item.total_amount,
        item.wbs_code,
      ]);
    }
    return;
  }

  if (sectionId === 'detailed_resource_analysis') {
    sheet.addRow(['Code', 'Description', 'Unit', 'Unit Cost', 'Category']);
    const resources = Array.isArray(payload.resources) ? payload.resources : [];
    for (const row of resources) {
      const item = row as Record<string, unknown>;
      sheet.addRow([
        item.code,
        item.description,
        item.unit,
        item.unit_cost,
        item.category,
      ]);
    }
    return;
  }

  if (sectionId === 'wbs_summary') {
    sheet.addRow(['WBS Code', 'Description', 'Level', 'Direct', 'Combined']);
    const nodes = Array.isArray(payload.nodes) ? payload.nodes : [];
    for (const row of nodes) {
      const node = row as Record<string, unknown>;
      sheet.addRow([
        node.wbs_code,
        node.description,
        node.level,
        node.direct_total,
        node.combined_total,
      ]);
    }
    return;
  }

  if (
    sectionId === 'estimate_summary' ||
    sectionId === 'cost_breakdown' ||
    sectionId === 'bid_composition'
  ) {
    const breakdown = (payload.breakdown ?? {}) as Record<string, number>;
    sheet.addRow(['Line', 'Amount']);
    for (const [key, value] of Object.entries(breakdown)) {
      sheet.addRow([key, value]);
    }
    return;
  }

  if (
    sectionId === 'assumptions' ||
    sectionId === 'exclusions' ||
    sectionId === 'commercial_notes' ||
    sectionId === 'executive_summary'
  ) {
    sheet.addRow([
      String(
        payload.text ??
          payload.narrative ??
          JSON.stringify(payload).slice(0, 2000)
      ),
    ]);
    sheet.getColumn(1).width = 100;
    return;
  }

  if (sectionId === 'ai_insights') {
    sheet.addRow(['Action', 'Created At']);
    const events = Array.isArray(payload.events) ? payload.events : [];
    for (const row of events) {
      const event = row as Record<string, unknown>;
      sheet.addRow([event.action, event.created_at]);
    }
    return;
  }

  sheet.addRow([JSON.stringify(payload)]);
}
