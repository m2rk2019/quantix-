import { exportBenchmarkReportExcel } from '@/services/benchmark/export-benchmark-report';
import type { BenchmarkReportType } from '@/types/benchmark';
import { BENCHMARK_REPORT_LABELS } from '@/types/benchmark';

export const dynamic = 'force-dynamic';

const VALID = new Set(Object.keys(BENCHMARK_REPORT_LABELS));

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const report = (url.searchParams.get('report') ?? 'executive_accuracy') as BenchmarkReportType;
  const projectId = url.searchParams.get('projectId') ?? undefined;

  if (!VALID.has(report)) {
    return Response.json({ error: 'Invalid report type' }, { status: 400 });
  }

  const result = await exportBenchmarkReportExcel(report, projectId);

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
