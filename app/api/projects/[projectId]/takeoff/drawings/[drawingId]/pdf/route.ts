import { NextResponse } from 'next/server';

import { getAuthUser } from '@/lib/auth/session';
import { getTakeoffDrawingContent } from '@/services/takeoff/drawings';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ projectId: string; drawingId: string }>;
}

export async function GET(
  _request: Request,
  { params }: RouteParams
): Promise<Response> {
  const { projectId, drawingId } = await params;
  const { profile } = await getAuthUser();
  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const content = await getTakeoffDrawingContent(projectId, drawingId);
  if (!content) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const buffer = Buffer.from(content.content_base64, 'base64');
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': content.mime_type || 'application/pdf',
      'Content-Length': String(buffer.length),
      'Cache-Control': 'private, max-age=60',
    },
  });
}
