import { revalidatePath } from 'next/cache';

import { invalidateProjectCaches } from '@/lib/cache/invalidate-project-cache';
import { ROUTES } from '@/lib/constants/routes';
import { syncEstimateSummary } from '@/services/estimate/sync-estimate-summary';

export async function refreshProjectEstimate(
  projectId: string,
  profileId?: string
): Promise<void> {
  await syncEstimateSummary(projectId, profileId);
  invalidateProjectCaches(projectId);
  revalidatePath(ROUTES.projectSummary(projectId));  revalidatePath(ROUTES.project(projectId));
  revalidatePath(ROUTES.projectBoq(projectId));
  revalidatePath(ROUTES.dashboard);
  revalidatePath(ROUTES.projects);
}
