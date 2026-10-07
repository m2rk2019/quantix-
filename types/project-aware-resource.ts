import type { RateLibraryItem } from '@/types/rate-library';

/** Where a resolvable resource came from for estimating. */
export type ResourceLibrarySource = 'project' | 'company';

/**
 * Unified resource shape for BOQ rate analysis, AI matching, and pickers.
 * `id` is the primary key to store on analysis lines for the active source.
 */
export interface ProjectAwareLibraryItem extends RateLibraryItem {
  source: ResourceLibrarySource;
  /** Project-owned copy id when source is project; otherwise null. */
  project_library_item_id: string | null;
  /** Company master id (source_company_item_id or company row id). */
  company_library_item_id: string | null;
}

export interface ProjectResourceSourceMeta {
  projectId: string;
  /** True when the project has at least one active project rate row. */
  usesProjectLibrary: boolean;
  projectResourceCount: number;
  source: ResourceLibrarySource;
}

export interface ResolvedResourceCost {
  /** Effective unit cost for the analysis line. */
  unitCost: number | null;
  source: ResourceLibrarySource | null;
  projectLibraryItemId: string | null;
  companyLibraryItemId: string | null;
}
