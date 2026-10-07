import { requireUserProfile } from '@/lib/auth/session';
import { logAuditEvent } from '@/services/audit/log-audit-event';
import { listBoqItems } from '@/services/boq/list-boq-items';
import {
  buildExcelWorkbook,
  buildExportFilename,
} from '@/services/export/excel-export';
import { loadExcelExportData } from '@/services/export/load-export-data';
import { getProjectById } from '@/services/projects/list-projects';
import { validateEstimate } from '@/services/validation/validate-estimate';
import type { BoqItem } from '@/types/boq';

const BOQ_EXPORT_PAGE_SIZE = 1000;

export type ExportEstimateResult =
  | { ok: true; buffer: Buffer; filename: string }
  | { ok: false; status: 401 | 403 | 404 | 422; message: string };

async function* streamBoqItems(projectId: string): AsyncGenerator<BoqItem> {
  let page = 1;

  while (true) {
    const result = await listBoqItems(projectId, {
      page,
      pageSize: BOQ_EXPORT_PAGE_SIZE,
      sort: 'item_code',
      order: 'asc',
    });

    for (const item of result.items) {
      yield item;
    }

    if (page >= result.totalPages) {
      break;
    }

    page += 1;
  }
}

export async function exportProjectEstimateExcel(
  projectId: string
): Promise<ExportEstimateResult> {
  let profile;

  try {
    profile = await requireUserProfile();
  } catch {
    return { ok: false, status: 401, message: 'Unauthorized' };
  }

  const project = await getProjectById(projectId);

  if (!project) {
    return { ok: false, status: 404, message: 'Project not found' };
  }

  const validation = await validateEstimate(projectId, {
    role: profile.role,
    userId: profile.id,
  });

  if (!validation.hasExportPermission) {
    return {
      ok: false,
      status: 403,
      message: 'You do not have permission to export this estimate.',
    };
  }

  if (!validation.canExport) {
    return {
      ok: false,
      status: 422,
      message:
        validation.exportBlockedReason ??
        'Export is blocked until validation errors are resolved.',
    };
  }

  const exportData = await loadExcelExportData(projectId);

  if (!exportData) {
    return { ok: false, status: 404, message: 'Estimate data not found' };
  }

  const filename = buildExportFilename(exportData.project.project_code);
  const buffer = await buildExcelWorkbook(exportData, streamBoqItems(projectId));

  await logAuditEvent({
    projectId,
    entityType: 'project',
    entityId: projectId,
    action: 'project.exported',
    actorId: profile.id,
    module: 'lifecycle',
    remarks: `Exported estimate workbook (${filename})`,
    payload: {
      project_code: exportData.project.project_code,
      project_status: exportData.project.status,
      filename,
    },
  });

  return { ok: true, buffer, filename };
}
