import type { ExecutiveProjectStatus } from '@/types/dashboard';
import type { ProjectStatus } from '@/types/project';

export function mapExecutiveStatus(
  status: ProjectStatus,
  submittedAt: string | null
): ExecutiveProjectStatus {
  switch (status) {
    case 'draft':
      return 'draft';
    case 'in_progress':
      return 'estimating';
    case 'for_review':
      return submittedAt ? 'submitted' : 'review';
    case 'approved':
      return 'awarded';
    case 'archived':
      return 'archived';
    default:
      return 'draft';
  }
}

export function isActiveProjectStatus(status: ProjectStatus): boolean {
  return (
    status === 'in_progress' ||
    status === 'for_review' ||
    status === 'approved'
  );
}

export function isCompletedProjectStatus(status: ProjectStatus): boolean {
  return status === 'approved';
}
