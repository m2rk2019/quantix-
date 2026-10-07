import type { UserRole } from '@/types/auth';

export type AuditModule =
  | 'project_details'
  | 'estimate_settings'
  | 'wbs'
  | 'boq'
  | 'lifecycle'
  | 'admin'
  | 'project_rate'
  | 'historical'
  | 'tender';

export interface AuditHistoryEntry {
  id: string;
  date: string;
  time: string;
  createdAt: string;
  userId: string | null;
  userName: string;
  userRole: UserRole | null;
  action: string;
  actionLabel: string;
  module: AuditModule;
  moduleLabel: string;
  oldValue: string | null;
  newValue: string | null;
  remarks: string | null;
}

export interface AuditHistoryFilters {
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  module?: AuditModule;
}

export interface AuditHistoryResult {
  entries: AuditHistoryEntry[];
  users: Array<{ id: string; fullName: string }>;
  total: number;
}

export const AUDIT_MODULE_LABELS: Record<AuditModule, string> = {
  project_details: 'Project Details',
  estimate_settings: 'Estimate Settings',
  wbs: 'WBS',
  boq: 'BOQ',
  lifecycle: 'Lifecycle',
  admin: 'Administration',
  project_rate: 'Project Rate Library',
  historical: 'Historical Projects',
  tender: 'Tender Submission',
};

export const AUDIT_MODULES: readonly AuditModule[] = [
  'project_details',
  'estimate_settings',
  'wbs',
  'boq',
  'lifecycle',
] as const;
