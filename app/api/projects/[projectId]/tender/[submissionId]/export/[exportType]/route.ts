import { NextResponse } from 'next/server';

import { requireUserProfile } from '@/lib/auth/session';
import { getTenderExportFile } from '@/services/tender/list-tender-submissions';
import type { TenderExportType } from '@/types/tender';

export const runtime = 'nodejs';

const EXPORT_TYPES = new Set(['pdf', 'excel', 'zip']);

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      projectId: string;
      submissionId: string;
      exportType: string;
    }>;
  }
): Promise<Response> {
  try {
    await requireUserProfile();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { projectId, submissionId, exportType } = await context.params;
  if (!EXPORT_TYPES.has(exportType)) {
    return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
  }

  const file = await getTenderExportFile({
    projectId,
    tenderSubmissionId: submissionId,
    exportType: exportType as TenderExportType,
  });

  if (!file) {
    return NextResponse.json({ error: 'Export not found' }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.content), {
    status: 200,
    headers: {
      'Content-Type': file.mime_type,
      'Content-Disposition': `attachment; filename="${file.filename}"`,
      'Content-Length': String(file.content.byteLength),
      'Cache-Control': 'no-store',
    },
  });
}
