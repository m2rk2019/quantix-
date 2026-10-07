'use server';

import { requireUserProfile } from '@/lib/auth/session';
import { validateEstimate } from '@/services/validation/validate-estimate';
import type { EstimateValidationResult } from '@/types/validation';

export async function loadEstimateValidationAction(
  projectId: string
): Promise<EstimateValidationResult> {
  const profile = await requireUserProfile();

  return validateEstimate(projectId, {
    role: profile.role,
    userId: profile.id,
  });
}
