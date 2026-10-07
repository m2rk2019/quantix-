import { exportExecutiveReportExcel } from '@/services/dashboard/export-executive-report';
import type { ExecutiveReportType } from '@/types/dashboard';
import { EXECUTIVE_REPORT_LABELS } from '@/types/dashboard';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const VALID_REPORTS = new Set(Object.keys(EXECUTIVE_REPORT_LABELS));

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const reportParam = url.searchParams.get('report') ?? 'executive_summary';

  if (!VALID_REPORTS.has(reportParam)) {
    return Response.json({ error: 'Invalid report type' }, { status: 400 });
  }

  const searchParams: Record<string, string | undefined> = {};
  url.searchParams.forEach((value, key) => {
    if (key !== 'report') {
      searchParams[key] = value;
    }
  });

  const result = await exportExecutiveReportExcel(
    reportParam as ExecutiveReportType,
    searchParams
  );

  if (!result.ok) {
    return Response.json({ error: result.message }, { status: result.status });
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
