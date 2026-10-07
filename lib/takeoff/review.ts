/**
 * Review dashboard aggregations — Phase 4.
 */

import type {
  TakeoffMeasurement,
  TakeoffReviewStatus,
} from '@/types/takeoff';

export interface TakeoffReviewStats {
  total: number;
  draft: number;
  checked: number;
  pending_review: number;
  approved: number;
  rejected: number;
}

export function computeReviewStats(
  measurements: TakeoffMeasurement[]
): TakeoffReviewStats {
  const stats: TakeoffReviewStats = {
    total: measurements.length,
    draft: 0,
    checked: 0,
    pending_review: 0,
    approved: 0,
    rejected: 0,
  };

  for (const m of measurements) {
    const s: TakeoffReviewStatus = m.review_status ?? 'draft';
    if (s === 'draft') stats.draft += 1;
    else if (s === 'checked') stats.checked += 1;
    else if (s === 'approved') stats.approved += 1;
    else if (s === 'rejected') stats.rejected += 1;
  }
  stats.pending_review = stats.draft + stats.checked;
  return stats;
}

export const REVIEW_STATUS_LABELS: Record<TakeoffReviewStatus, string> = {
  draft: 'Draft',
  checked: 'Checked',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const REVIEW_STATUS_COLORS: Record<TakeoffReviewStatus, string> = {
  draft: '#94a3b8',
  checked: '#f59e0b',
  approved: '#16a34a',
  rejected: '#dc2626',
};
