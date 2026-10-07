import { notFound } from 'next/navigation';

import { PageTitle } from '@/components/layout/PageTitle';
import { TakeoffWorkspace } from '@/features/takeoff/components/TakeoffWorkspace';
import { getAuthUser } from '@/lib/auth/session';
import { getProjectById } from '@/services/projects/list-projects';
import {
  getTakeoffBoqDashboard,
  listBoqOptionsForTakeoff,
  listTakeoffBoqLinks,
  validateTakeoffBoqLinks,
} from '@/services/takeoff/boq-link';
import { listTakeoffComments } from '@/services/takeoff/comments';
import { listTakeoffDrawings, listTakeoffSheets } from '@/services/takeoff/drawings';
import { ensureDefaultTakeoffLayers } from '@/services/takeoff/ensure-layers';
import { listTakeoffLayers } from '@/services/takeoff/sheets-layers';
import { listTakeoffMeasurements } from '@/services/takeoff/measurements';
import { listTakeoffRevisionClouds } from '@/services/takeoff/revision-clouds';
import { canEditWbs } from '@/types/wbs';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ measurementId?: string; boqId?: string }>;
}

export default async function ProjectTakeoffPage({
  params,
  searchParams,
}: PageProps): Promise<React.JSX.Element> {
  const { projectId } = await params;
  const query = await searchParams;
  const { profile } = await getAuthUser();
  if (!profile) notFound();

  const project = await getProjectById(projectId);
  if (!project) notFound();

  await ensureDefaultTakeoffLayers(projectId, profile.id);

  const [
    drawings,
    sheets,
    layers,
    measurements,
    revisionClouds,
    comments,
    links,
    boqOptions,
    dashboard,
    validation,
  ] = await Promise.all([
    listTakeoffDrawings(projectId),
    listTakeoffSheets(projectId),
    listTakeoffLayers(projectId),
    listTakeoffMeasurements(projectId),
    listTakeoffRevisionClouds(projectId),
    listTakeoffComments(projectId),
    listTakeoffBoqLinks(projectId),
    listBoqOptionsForTakeoff(projectId),
    getTakeoffBoqDashboard(projectId),
    validateTakeoffBoqLinks(projectId),
  ]);

  const isOwner = project.created_by === profile.id;
  const canEdit = canEditWbs(profile.role, project.status, isOwner);

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[560px] flex-col">
      <PageTitle title="Quantity Takeoff" />
      <p className="mb-3 text-sm text-muted-foreground">
        Quantity Takeoff workspace (V1.1 Phase 5 — BOQ Integration). Measurements
        can be assigned to BOQ items; Import Engine and V1 estimating modules remain
        frozen.
      </p>
      <TakeoffWorkspace
        projectId={projectId}
        canEdit={canEdit}
        initialDrawings={drawings}
        initialSheets={sheets}
        initialLayers={layers}
        initialMeasurements={measurements}
        initialRevisionClouds={revisionClouds}
        initialComments={comments}
        initialLinks={links}
        initialBoqOptions={boqOptions}
        initialDashboard={dashboard}
        initialValidation={validation}
        highlightMeasurementId={query.measurementId ?? null}
        highlightBoqId={query.boqId ?? null}
      />
    </div>
  );
}
