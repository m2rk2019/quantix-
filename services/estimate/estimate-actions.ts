'use server';

import { revalidatePath } from 'next/cache';

import { ROUTES } from '@/lib/constants/routes';
import { assertBoqReadAccess } from '@/services/boq/assert-boq-access';
import { getEstimateSummary } from '@/services/estimate/get-estimate-summary';
import { syncEstimateSummary } from '@/services/estimate/sync-estimate-summary';
import { updateEstimateMarkups } from '@/services/estimate/update-estimate-markups';
import type { EstimatePercentages, EstimateSummaryData } from '@/types/estimate';

export async function loadEstimateSummaryAction(
  projectId: string
): Promise<EstimateSummaryData | null> {
  const access = await assertBoqReadAccess(projectId);
  if (!access.ok) {
    return null;
  }

  return getEstimateSummary(projectId, { sync: true });
}

export async function refreshEstimateSummaryAction(
  projectId: string
): Promise<EstimateSummaryData | null> {
  const access = await assertBoqReadAccess(projectId);
  if (!access.ok) {
    return null;
  }

  await syncEstimateSummary(projectId);
  revalidatePath(ROUTES.projectSummary(projectId));
  revalidatePath(ROUTES.project(projectId));
  revalidatePath(ROUTES.dashboard);

  return getEstimateSummary(projectId, { sync: false });
}

export async function updateEstimateMarkupsAction(
  projectId: string,
  percentages: Partial<EstimatePercentages>
): Promise<{ success: boolean; error?: string }> {
  const access = await assertBoqReadAccess(projectId);
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  return updateEstimateMarkups(projectId, percentages);
}
