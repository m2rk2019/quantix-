import { exportUatReportExcel } from '@/services/uat/export-uat-report';
import { UAT_REPORT_LABELS, type UatReportType } from '@/types/uat';

export const dynamic = 'force-dynamic';

const VALID = new Set(Object.keys(UAT_REPORT_LABELS));

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const report = (url.searchParams.get('report') ?? 'executive_uat') as UatReportType;
  const projectId = url.searchParams.get('projectId') ?? undefined;

  if (!VALID.has(report)) {
    return Response.json({ error: 'Invalid report type' }, { status: 400 });
  }

  const result = await exportUatReportExcel(report, projectId);

  if (!result.ok) {
    return Response.json({ error: result.message }, { status: 400 });
  }

  return new Response(new Uint8Array(result.buffer), {
    status: 200,
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
