import { getEstimateSummary } from '@/services/estimate/get-estimate-summary';
import { getProjectDetails } from '@/services/projects/get-project-details';
import type { EstimateSummaryData } from '@/types/estimate';
import type { ProjectDetailsRecord } from '@/types/project';

export async function getCachedProjectMetadata(
  projectId: string
): Promise<ProjectDetailsRecord | null> {
  return getProjectDetails(projectId);
}

export async function getCachedEstimateSummary(
  projectId: string,
  options?: { sync?: boolean; profileId?: string }
): Promise<EstimateSummaryData | null> {
  return getEstimateSummary(projectId, options);
}
