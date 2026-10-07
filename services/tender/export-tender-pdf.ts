import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

import type { TenderPackageSnapshot, TenderSectionId } from '@/types/tender';
import { TENDER_SECTION_LABELS } from '@/types/tender';

function money(value: number, currency = 'PHP'): string {
  return `${currency} ${Number(value).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export async function buildTenderPdfBuffer(
  snapshot: TenderPackageSnapshot
): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const maxWidth = pageWidth - margin * 2;
  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const ensureSpace = (needed: number) => {
    if (y - needed < margin) {
      page = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  };

  const drawText = (
    text: string,
    options?: { bold?: boolean; size?: number; color?: ReturnType<typeof rgb> }
  ) => {
    const size = options?.size ?? 10;
    const usedFont = options?.bold ? fontBold : font;
    // StandardFonts use WinAnsi — replace currency symbols / non-Latin1.
    const safeText = text
      .replaceAll('₱', 'PHP')
      .replace(/[^\u0000-\u00ff]/g, '?');
    const words = safeText.split(/\s+/);
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      const width = usedFont.widthOfTextAtSize(test, size);
      if (width > maxWidth && line) {
        ensureSpace(size + 4);
        page.drawText(line, {
          x: margin,
          y,
          size,
          font: usedFont,
          color: options?.color ?? rgb(0.1, 0.1, 0.1),
        });
        y -= size + 4;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) {
      ensureSpace(size + 4);
      page.drawText(line, {
        x: margin,
        y,
        size,
        font: usedFont,
        color: options?.color ?? rgb(0.1, 0.1, 0.1),
      });
      y -= size + 4;
    }
  };

  const heading = (title: string) => {
    ensureSpace(28);
    y -= 8;
    drawText(title, { bold: true, size: 14, color: rgb(0.89, 0.12, 0.14) });
    y -= 4;
  };

  const { branding, project, sections, enabled_sections } = snapshot;

  drawText(branding.company_name, { bold: true, size: 18 });
  if (branding.address) drawText(branding.address, { size: 9 });
  const contact = [branding.phone, branding.email, branding.website]
    .filter(Boolean)
    .join(' · ');
  if (contact) drawText(contact, { size: 9 });
  if (branding.report_header) {
    y -= 4;
    drawText(branding.report_header, { size: 9 });
  }
  y -= 10;
  drawText('TENDER SUBMISSION PACKAGE', { bold: true, size: 16 });
  drawText(project.project_name, { bold: true, size: 13 });
  drawText(`${project.project_code} · ${project.client_name}`);
  if (project.location) drawText(`Location: ${project.location}`);
  y -= 8;
  drawText(`Prepared by: ${branding.prepared_by}`);
  drawText(`Checked by: ${branding.checked_by}`);
  drawText(`Approved by: ${branding.approved_by}`);
  drawText(`Generated: ${new Date(snapshot.generated_at).toLocaleString()}`);

  for (const sectionId of enabled_sections) {
    const payload = sections[sectionId];
    if (!payload) continue;
    heading(TENDER_SECTION_LABELS[sectionId as TenderSectionId] ?? sectionId);
    renderSection(sectionId, payload as Record<string, unknown>, drawText, money);
  }

  if (branding.report_footer) {
    y -= 12;
    drawText(branding.report_footer, { size: 8 });
  }

  const bytes = await doc.save();
  return Buffer.from(bytes);
}

function renderSection(
  sectionId: string,
  payload: Record<string, unknown>,
  drawText: (text: string, options?: { bold?: boolean; size?: number }) => void,
  money: (value: number, currency?: string) => string
): void {
  switch (sectionId) {
    case 'cover_page': {
      drawText(`Project: ${String(payload.project_name ?? '')}`);
      drawText(`Client: ${String(payload.client_name ?? '')}`);
      drawText(
        `Grand Total: ${money(Number(payload.grand_total ?? 0), String(payload.currency ?? 'PHP'))}`
      );
      break;
    }
    case 'executive_summary': {
      drawText(String(payload.narrative ?? ''));
      const disciplines = Array.isArray(payload.discipline_breakdown)
        ? payload.discipline_breakdown
        : [];
      for (const row of disciplines.slice(0, 12)) {
        const item = row as { name?: string; amount?: number; percent?: number };
        drawText(
          `• ${item.name ?? '—'}: ${money(Number(item.amount ?? 0))} (${Number(item.percent ?? 0).toFixed(1)}%)`
        );
      }
      break;
    }
    case 'estimate_summary':
    case 'cost_breakdown':
    case 'bid_composition': {
      const breakdown = (payload.breakdown ?? {}) as Record<string, number>;
      for (const [key, value] of Object.entries(breakdown)) {
        drawText(`${key.replaceAll('_', ' ')}: ${money(Number(value ?? 0))}`);
      }
      break;
    }
    case 'boq': {
      const items = Array.isArray(payload.items) ? payload.items : [];
      drawText(`BOQ items: ${items.length}`);
      for (const row of items.slice(0, 80)) {
        const item = row as {
          item_code?: string;
          description?: string;
          total_amount?: number;
        };
        drawText(
          `${item.item_code ?? ''} — ${(item.description ?? '').slice(0, 70)} — ${money(Number(item.total_amount ?? 0))}`,
          { size: 8 }
        );
      }
      if (items.length > 80) {
        drawText(`… and ${items.length - 80} more items`, { size: 8 });
      }
      break;
    }
    case 'detailed_resource_analysis': {
      const resources = Array.isArray(payload.resources) ? payload.resources : [];
      drawText(`Resources: ${resources.length}`);
      for (const row of resources.slice(0, 60)) {
        const item = row as {
          code?: string;
          description?: string;
          unit_cost?: number;
        };
        drawText(
          `${item.code ?? ''} — ${(item.description ?? '').slice(0, 60)} — ${money(Number(item.unit_cost ?? 0))}`,
          { size: 8 }
        );
      }
      break;
    }
    case 'wbs_summary': {
      const nodes = Array.isArray(payload.nodes) ? payload.nodes : [];
      for (const row of nodes.slice(0, 80)) {
        const node = row as {
          wbs_code?: string;
          description?: string;
          level?: number;
          combined_total?: number;
        };
        const indent = '  '.repeat(Math.max(0, Number(node.level ?? 0)));
        drawText(
          `${indent}${node.wbs_code ?? ''} ${node.description ?? ''} — ${money(Number(node.combined_total ?? 0))}`,
          { size: 8 }
        );
      }
      break;
    }
    case 'ai_insights': {
      const events = Array.isArray(payload.events) ? payload.events : [];
      if (events.length === 0) {
        drawText('No AI estimator events recorded for this project.');
      } else {
        for (const row of events.slice(0, 20)) {
          const event = row as { action?: string; created_at?: string };
          drawText(
            `• ${event.action ?? 'ai'} @ ${event.created_at ? new Date(event.created_at).toLocaleString() : '—'}`,
            { size: 8 }
          );
        }
      }
      break;
    }
    case 'assumptions':
    case 'exclusions':
    case 'commercial_notes': {
      drawText(String(payload.text ?? '—'));
      break;
    }
    default:
      drawText(JSON.stringify(payload).slice(0, 500), { size: 8 });
  }
}
