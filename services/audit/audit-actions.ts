'use server';

import { listAuditHistory } from '@/services/audit/list-audit-history';
import type {
  AuditHistoryFilters,
  AuditHistoryResult,
} from '@/types/audit';

export async function loadAuditHistoryAction(
  projectId: string,
  filters: AuditHistoryFilters = {}
): Promise<AuditHistoryResult> {
  return listAuditHistory(projectId, filters);
}
