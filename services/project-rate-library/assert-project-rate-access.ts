import { assertWbsEditAccess, assertWbsReadAccess } from '@/services/wbs/assert-wbs-access';

export async function assertProjectRateReadAccess(projectId: string) {
  return assertWbsReadAccess(projectId);
}

export async function assertProjectRateEditAccess(projectId: string) {
  const access = await assertWbsEditAccess(projectId);
  if (!access.ok) {
    return {
      ok: false as const,
      error: access.error.replace('WBS', 'project rate library'),
    };
  }
  return access;
}
