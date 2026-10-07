import type { UserRole } from './auth';
import type { ProjectStatus } from './project';
import { canEditProjectMetadata } from './project';

export interface WbsNode {
  id: string;
  project_id: string;
  parent_id: string | null;
  level: number;
  wbs_code: string;
  description: string;
  sort_order: number;
  child_count: number;
  descendant_count: number;
  boq_item_count: number;
  has_children: boolean;
}

export interface WbsNodePathSegment {
  id: string;
  wbs_code: string;
  description: string;
}

export interface WbsSearchResult {
  id: string;
  wbs_code: string;
  description: string;
  level: number;
  parent_id: string | null;
  path: WbsNodePathSegment[];
}

export interface WbsClipboardBranch {
  description: string;
  children: WbsClipboardBranch[];
}

export interface CreateWbsNodeInput {
  project_id: string;
  parent_id?: string | null;
  description: string;
}

export interface UpdateWbsNodeInput {
  description: string;
}

export type WbsDropPosition = 'before' | 'after' | 'inside';

export function canEditWbs(
  role: UserRole,
  status: ProjectStatus,
  isOwner: boolean
): boolean {
  return canEditProjectMetadata(role, status, isOwner);
}
