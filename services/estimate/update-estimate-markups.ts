import { revalidatePath } from 'next/cache';

import { canEditEstimateMarkups } from '@/lib/auth/permissions';
import { ROUTES } from '@/lib/constants/routes';
import { createClient } from '@/lib/supabase/server';
import { requireProvisionedUserProfile } from '@/lib/auth/session';
import { refreshProjectEstimate } from '@/services/estimate/refresh-project-estimate';
import { getProjectById } from '@/services/projects/list-projects';
import type { EstimatePercentages } from '@/types/estimate';

export async function updateEstimateMarkups(
  projectId: string,
  percentages: Partial<EstimatePercentages>
): Promise<{ success: boolean; error?: string }> {
  const profile = await requireProvisionedUserProfile();

  if (!canEditEstimateMarkups(profile.role)) {
    return {
      success: false,
      error: 'You do not have permission to edit estimate markups.',
    };
  }

  const project = await getProjectById(projectId);
  if (!project) {
    return { success: false, error: 'Project not found.' };
  }

  const isOwner = project.created_by === profile.id;
  if (profile.role === 'estimator' && !isOwner) {
    return {
      success: false,
      error: 'Estimators can only edit markups on their own projects.',
    };
  }

  const patch: Partial<EstimatePercentages> = {};

  for (const [key, value] of Object.entries(percentages) as Array<
    [keyof EstimatePercentages, number | undefined]
  >) {
    if (value === undefined) {
      continue;
    }
    if (value < 0 || value > 100) {
      return { success: false, error: 'Percentages must be between 0 and 100.' };
    }
    patch[key] = value;
  }

  if (Object.keys(patch).length === 0) {
    return { success: false, error: 'No markup values to update.' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('project_details')
    .update(patch)
    .eq('project_id', projectId);

  if (error) {
    return { success: false, error: error.message };
  }

  await refreshProjectEstimate(projectId, profile.id);
  revalidatePath(ROUTES.projectSummary(projectId));
  revalidatePath(ROUTES.project(projectId));

  return { success: true };
}
