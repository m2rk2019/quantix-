'use server';

import { revalidatePath } from 'next/cache';

import { answerEstimatorQuestion } from '@/lib/ai-estimator/chat-responses';
import { runScopeChecker } from '@/lib/ai-estimator/scope-checker';
import { ROUTES } from '@/lib/constants/routes';
import { applyAiEstimatePlan } from '@/services/ai-estimator/apply-estimate-plan';
import { buildAiEstimatePlan } from '@/services/ai-estimator/build-estimate-plan';
import { assertBoqReadAccess } from '@/services/boq/assert-boq-access';
import type {
  AiEstimatePlan,
  ApplyAiEstimateResult,
} from '@/types/ai-estimator';

export async function generateAiEstimatePlanAction(
  projectId: string,
  description: string
): Promise<{ success: boolean; plan?: AiEstimatePlan; error?: string }> {
  return buildAiEstimatePlan(projectId, description);
}

export async function applyAiEstimatePlanAction(
  plan: AiEstimatePlan
): Promise<ApplyAiEstimateResult> {
  const result = await applyAiEstimatePlan(plan);

  if (result.success) {
    revalidatePath(ROUTES.projectAiEstimator(plan.project_id));
  }

  return result;
}

export async function refreshAiScopeCheckAction(
  plan: AiEstimatePlan
): Promise<{ success: boolean; issues?: AiEstimatePlan['scope_issues']; error?: string }> {
  const access = await assertBoqReadAccess(plan.project_id);
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  return {
    success: true,
    issues: runScopeChecker(plan),
  };
}

export async function askAiEstimatorAction(
  projectId: string,
  question: string,
  plan: AiEstimatePlan | null
): Promise<{ success: boolean; answer?: string; error?: string }> {
  const access = await assertBoqReadAccess(projectId);
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const trimmed = question.trim();
  if (!trimmed) {
    return { success: false, error: 'Enter a question.' };
  }

  return {
    success: true,
    answer: answerEstimatorQuestion(trimmed, plan),
  };
}
