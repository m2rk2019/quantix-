import { exportProjectEstimateExcel } from '@/services/export/export-estimate';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

interface ExportRouteContext {
  params: Promise<{ projectId: string }>;
}

export async function GET(
  _request: Request,
  context: ExportRouteContext
): Promise<Response> {
  const { projectId } = await context.params;
  const result = await exportProjectEstimateExcel(projectId);

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
