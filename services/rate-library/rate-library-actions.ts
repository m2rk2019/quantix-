'use server';

import {
  createRateLibraryItem,
  deleteRateLibraryItem,
  importRateLibraryItems,
  listRateLibraryItems,
  toggleRateLibraryFavorite,
  updateRateLibraryItem,
} from '@/services/rate-library/rate-library';
import {
  clearRateOverride,
  getRateAnalysis,
  refreshStaleLibraryRates,
  saveRateAnalysis,
} from '@/services/rate-analysis/rate-analysis';
import type {
  CreateRateLibraryItemInput,
  RateAnalysisData,
  RateLibraryListParams,
  RateLibraryListResult,
  SaveRateAnalysisInput,
  UpdateRateLibraryItemInput,
} from '@/types/rate-library';
import type { RateLibraryCategory } from '@/types/rate-library';

export async function loadRateLibraryAction(
  params: RateLibraryListParams
): Promise<RateLibraryListResult> {
  return listRateLibraryItems(params);
}

export async function loadProjectAwareRateLibraryAction(
  projectId: string,
  params: RateLibraryListParams
) {
  const { listProjectAwareResources } = await import(
    '@/services/project-rate-library/project-resource-source'
  );
  return listProjectAwareResources(projectId, params);
}

export async function createRateLibraryItemAction(
  input: CreateRateLibraryItemInput
): Promise<{ success: boolean; error?: string; itemId?: string }> {
  return createRateLibraryItem(input);
}

export async function updateRateLibraryItemAction(
  itemId: string,
  input: UpdateRateLibraryItemInput
): Promise<{ success: boolean; error?: string }> {
  return updateRateLibraryItem(itemId, input);
}

export async function deleteRateLibraryItemAction(
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  return deleteRateLibraryItem(itemId);
}

export async function importRateLibraryAction(
  items: CreateRateLibraryItemInput[]
): Promise<{ success: boolean; error?: string; imported: number }> {
  return importRateLibraryItems(items);
}

export async function toggleRateLibraryFavoriteAction(
  itemId: string
): Promise<{ success: boolean; error?: string; isFavorite: boolean }> {
  return toggleRateLibraryFavorite(itemId);
}

export async function getRateAnalysisAction(
  projectId: string,
  boqItemId: string
): Promise<RateAnalysisData | null> {
  return getRateAnalysis(projectId, boqItemId);
}

export async function saveRateAnalysisAction(
  projectId: string,
  boqItemId: string,
  input: SaveRateAnalysisInput
): Promise<{ success: boolean; error?: string; warnings?: string[] }> {
  return saveRateAnalysis(projectId, boqItemId, input);
}

export async function clearRateOverrideAction(
  projectId: string,
  boqItemId: string,
  category: RateLibraryCategory
): Promise<{ success: boolean; error?: string }> {
  return clearRateOverride(projectId, boqItemId, category);
}

export async function refreshStaleLibraryRatesAction(
  projectId: string,
  boqItemId: string
): Promise<{ success: boolean; error?: string; warnings?: string[] }> {
  return refreshStaleLibraryRates(projectId, boqItemId);
}
