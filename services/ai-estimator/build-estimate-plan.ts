import { listProjectAwareResources } from '@/services/project-rate-library/project-resource-source';
import { generateEstimatePlan } from '@/lib/ai-estimator/generate-plan';
import { assertBoqReadAccess } from '@/services/boq/assert-boq-access';
import {
  loadLearningBoostsForDescription,
  logAiEstimateGenerated,
} from '@/services/ai-estimator/ai-learning';
import { parseProjectDescription } from '@/lib/ai-estimator/parse-description';
import { requireProvisionedUserProfile } from '@/lib/auth/session';
import type { AiEstimatePlan } from '@/types/ai-estimator';

export async function buildAiEstimatePlan(
  projectId: string,
  description: string
): Promise<{ success: boolean; plan?: AiEstimatePlan; error?: string }> {
  const access = await assertBoqReadAccess(projectId);
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const trimmed = description.trim();
  if (!trimmed) {
    return { success: false, error: 'Project description is required.' };
  }

  if (trimmed.length < 12) {
    return {
      success: false,
      error: 'Provide a more detailed project description (at least 12 characters).',
    };
  }

  try {
    const profile = await requireProvisionedUserProfile();
    const parsed = parseProjectDescription(trimmed);
    const { learningBoost, quantityTypeBoosts } =
      await loadLearningBoostsForDescription(parsed);

    const aware = await listProjectAwareResources(projectId, {
      page: 1,
      pageSize: 500,
      activeOnly: true,
    });

    const plan = generateEstimatePlan({
      projectId,
      description: trimmed,
      libraryItems: aware.items,
      resourceSource: aware.source,
      learningBoost,
      quantityTypeBoosts,
    });

    await logAiEstimateGenerated(plan, profile.id);

    return { success: true, plan };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to build AI estimate plan.',
    };
  }
}
