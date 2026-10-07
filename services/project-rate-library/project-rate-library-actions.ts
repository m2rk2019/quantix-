'use server';

import {
  bulkChangeProjectRateUnit,
  bulkDeleteProjectRateItems,
  bulkDuplicateProjectRateItems,
  bulkUpdateProjectRateCategory,
  exportProjectRateItems,
} from '@/services/project-rate-library/bulk-project-rate-ops';
import { createProjectRateItem } from '@/services/project-rate-library/create-project-rate-item';
import { deleteProjectRateItem } from '@/services/project-rate-library/delete-project-rate-item';
import { detectStaleProjectRates } from '@/services/project-rate-library/detect-stale-rates';
import {
  importCompanyResourcesByFilter,
  importCompanyResourcesToProject,
} from '@/services/project-rate-library/import-from-company';
import { listProjectRateLibrary } from '@/services/project-rate-library/list-project-rate-library';
import {
  ignoreProjectRateCompanyUpdates,
  syncProjectRatesFromCompany,
} from '@/services/project-rate-library/sync-from-company';
import { updateProjectRateItem } from '@/services/project-rate-library/update-project-rate-item';
import type {
  CreateProjectRateItemInput,
  ProjectRateLibraryListParams,
  UpdateProjectRateItemInput,
} from '@/types/project-rate-library';
import type { RateLibraryCategory } from '@/types/rate-library';

export async function listProjectRateLibraryAction(
  params: ProjectRateLibraryListParams
) {
  return listProjectRateLibrary(params);
}

export async function createProjectRateItemAction(
  input: CreateProjectRateItemInput
) {
  return createProjectRateItem(input);
}

export async function updateProjectRateItemAction(
  projectId: string,
  itemId: string,
  input: UpdateProjectRateItemInput
) {
  return updateProjectRateItem(projectId, itemId, input);
}

export async function deleteProjectRateItemAction(
  projectId: string,
  itemId: string
) {
  return deleteProjectRateItem(projectId, itemId);
}

export async function importCompanyResourcesToProjectAction(
  projectId: string,
  companyItemIds: string[]
) {
  return importCompanyResourcesToProject(projectId, companyItemIds);
}

export async function importCompanyResourcesByFilterAction(
  projectId: string,
  filters: {
    category?: RateLibraryCategory | 'all';
    search?: string;
    activeOnly?: boolean;
  } = {}
) {
  return importCompanyResourcesByFilter(projectId, filters);
}

export async function detectStaleProjectRatesAction(projectId: string) {
  return detectStaleProjectRates(projectId);
}

export async function syncProjectRatesFromCompanyAction(
  projectId: string,
  itemIds: string[] | null = null
) {
  return syncProjectRatesFromCompany(projectId, itemIds);
}

export async function ignoreProjectRateCompanyUpdatesAction(
  projectId: string,
  itemIds: string[]
) {
  return ignoreProjectRateCompanyUpdates(projectId, itemIds);
}

export async function bulkDeleteProjectRateItemsAction(
  projectId: string,
  itemIds: string[]
) {
  return bulkDeleteProjectRateItems(projectId, itemIds);
}

export async function bulkDuplicateProjectRateItemsAction(
  projectId: string,
  itemIds: string[]
) {
  return bulkDuplicateProjectRateItems(projectId, itemIds);
}

export async function bulkUpdateProjectRateCategoryAction(
  projectId: string,
  itemIds: string[],
  category: RateLibraryCategory
) {
  return bulkUpdateProjectRateCategory(projectId, itemIds, category);
}

export async function bulkChangeProjectRateUnitAction(
  projectId: string,
  itemIds: string[],
  unit: string
) {
  return bulkChangeProjectRateUnit(projectId, itemIds, unit);
}

export async function exportProjectRateItemsAction(
  projectId: string,
  itemIds: string[]
) {
  return exportProjectRateItems(projectId, itemIds);
}
