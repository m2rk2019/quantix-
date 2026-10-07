import type { UserRole } from './auth';

export type ProjectStatus =
  | 'draft'
  | 'in_progress'
  | 'for_review'
  | 'approved'
  | 'archived';

export const PROJECT_STATUSES: readonly ProjectStatus[] = [
  'draft',
  'in_progress',
  'for_review',
  'approved',
  'archived',
] as const;

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Draft',
  in_progress: 'In Progress',
  for_review: 'For Review',
  approved: 'Approved',
  archived: 'Archived',
};

export function isProjectStatus(value: string): value is ProjectStatus {
  return (PROJECT_STATUSES as readonly string[]).includes(value);
}

export interface ProjectListItem {
  id: string;
  project_code: string;
  project_name: string;
  client_name: string;
  location: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  created_by: string;
  created_by_name: string;
}

export type CurrencyCode =
  | 'PHP'
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'AED'
  | 'SAR'
  | 'AUD'
  | 'CAD';

export type MeasurementSystem = 'metric' | 'imperial';

export type RoundingRule =
  | 'half_up'
  | 'half_down'
  | 'round_up'
  | 'round_down';

export type DefaultUnitSystem =
  | 'metric_si'
  | 'imperial_us'
  | 'metric_imperial_hybrid';

export type ProjectType =
  | 'residential'
  | 'commercial'
  | 'industrial'
  | 'infrastructure'
  | 'civil'
  | 'renovation'
  | 'other';

export type ContractType =
  | 'lump_sum'
  | 'unit_price'
  | 'cost_plus'
  | 'design_build'
  | 'management'
  | 'other';

export interface ProjectWithDetails {
  id: string;
  project_code: string;
  project_name: string;
  client_name: string;
  location: string | null;
  status: ProjectStatus;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  approved_at: string | null;
  archived_at: string | null;
  description: string | null;
  created_by_name: string;
}

export interface ProjectDetailsRecord extends ProjectWithDetails {
  owner: string | null;
  consultant: string | null;
  contractor: string | null;
  project_type: ProjectType | null;
  contract_type: ContractType | null;
  currency: CurrencyCode;
  vat_percent: number;
  markup_percent: number;
  contingency_percent: number;
  indirect_cost_percent: number;
  rounding_rule: RoundingRule;
  measurement_system: MeasurementSystem;
  default_unit_system: DefaultUnitSystem;
  updated_by_name: string | null;
  grand_total: number;
  wbs_node_count: number;
  boq_item_count: number;
  /** Master template this project was created from (reuse workflow). */
  source_master_template_id: string | null;
  source_master_template_name: string | null;
  /** Frozen template version string at project creation (e.g. "1.2"). */
  source_master_template_version: string | null;
  /** Latest Template Reuse Report JSON (empty object when unused). */
  template_reuse_report: Record<string, unknown> | null;
}

export interface ProjectStats {
  wbs_node_count: number;
  boq_item_count: number;
  grand_total: number;
}

export interface ProjectListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ProjectStatus[];
  sort?: 'project_code' | 'project_name' | 'client_name' | 'status' | 'updated_at';
  order?: 'asc' | 'desc';
}

export interface ProjectListResult {
  projects: ProjectListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateProjectInput {
  project_name: string;
  client_name: string;
  location?: string;
  description?: string;
}

export interface UpdateProjectDetailsInput {
  project_name: string;
  client_name: string;
  location?: string;
  description?: string;
  owner?: string;
  consultant?: string;
  contractor?: string;
  project_type?: ProjectType | '';
  contract_type?: ContractType | '';
  currency: CurrencyCode;
  vat_percent: number;
  markup_percent: number;
  contingency_percent: number;
  indirect_cost_percent: number;
  rounding_rule: RoundingRule;
  measurement_system: MeasurementSystem;
  default_unit_system: DefaultUnitSystem;
}

export type ProjectLifecycleAction =
  | 'start'
  | 'submit'
  | 'approve'
  | 'reject'
  | 'archive'
  | 'restore';

export function canCreateProjectRole(role: UserRole): boolean {
  return (
    role === 'super_admin' || role === 'admin' || role === 'estimator'
  );
}

export function canDeleteProjectRole(role: UserRole): boolean {
  return (
    role === 'super_admin' ||
    role === 'admin' ||
    role === 'estimator'
  );
}

export function canEditProjectMetadata(
  role: UserRole,
  status: ProjectStatus,
  isOwner: boolean
): boolean {
  if (status === 'archived') {
    return false;
  }

  if (status === 'approved') {
    return role === 'super_admin' || role === 'admin';
  }

  if (status === 'for_review') {
    if (role === 'super_admin' || role === 'admin') {
      return true;
    }
    if (role === 'quantity_surveyor') {
      return true;
    }
    return false;
  }

  if (role === 'viewer') {
    return false;
  }

  if (role === 'estimator') {
    return isOwner;
  }

  return (
    role === 'super_admin' ||
    role === 'admin' ||
    role === 'quantity_surveyor'
  );
}

export function canDeleteProject(
  role: UserRole,
  isOwner: boolean
): boolean {
  if (!canDeleteProjectRole(role)) {
    return false;
  }

  if (role === 'estimator') {
    return isOwner;
  }

  return true;
}

export function getNextStatus(
  action: ProjectLifecycleAction,
  current: ProjectStatus
): ProjectStatus | null {
  switch (action) {
    case 'start':
      return current === 'draft' ? 'in_progress' : null;
    case 'submit':
      return current === 'in_progress' ? 'for_review' : null;
    case 'approve':
      return current === 'for_review' ? 'approved' : null;
    case 'reject':
      return current === 'for_review' ? 'in_progress' : null;
    case 'archive':
      return current === 'approved' ? 'archived' : null;
    case 'restore':
      return current === 'archived' ? 'approved' : null;
    default:
      return null;
  }
}

export function canPerformLifecycleAction(
  role: UserRole,
  action: ProjectLifecycleAction,
  status: ProjectStatus,
  isOwner: boolean
): boolean {
  switch (action) {
    case 'start':
      return (
        status === 'draft' &&
        (role === 'super_admin' ||
          role === 'admin' ||
          role === 'quantity_surveyor' ||
          (role === 'estimator' && isOwner))
      );
    case 'submit':
      return (
        status === 'in_progress' &&
        (role === 'super_admin' ||
          role === 'admin' ||
          role === 'quantity_surveyor' ||
          (role === 'estimator' && isOwner))
      );
    case 'approve':
      return (
        status === 'for_review' &&
        (role === 'super_admin' || role === 'admin')
      );
    case 'reject':
      return (
        status === 'for_review' &&
        (role === 'super_admin' ||
          role === 'admin' ||
          role === 'quantity_surveyor')
      );
    case 'archive':
      return (
        status === 'approved' &&
        (role === 'super_admin' || role === 'admin')
      );
    case 'restore':
      return (
        status === 'archived' &&
        (role === 'super_admin' || role === 'admin')
      );
    default:
      return false;
  }
}
