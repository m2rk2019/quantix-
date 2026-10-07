/**
 * Quantix Import Engine — frozen production version marker.
 * Do not change importer behavior without passing NIA + STREVI regression.
 */
export const QUANTIX_IMPORT_ENGINE_NAME = 'Quantix Import Engine';
export const QUANTIX_IMPORT_ENGINE_VERSION = '1.0.0';
export const QUANTIX_IMPORT_ENGINE_LABEL = 'Quantix Import Engine v1.0';
export const QUANTIX_IMPORT_ENGINE_FREEZE_DATE = '2026-10-05';

/** Canonical regression workbooks locked for v1.0. */
export const IMPORT_ENGINE_V1_REGRESSION_WORKBOOKS = [
  {
    key: 'nia',
    display_name: 'NIA Budgetary Cost Breakdown',
    sample_path: 'samples/NIA_Budgetary_Cost_Breakdown.xlsx',
  },
  {
    key: 'strevi',
    display_name: 'STREVI BCB Breakdown & Summary',
    sample_path: 'samples/STREVI_BCB_Breakdown.xlsx',
  },
] as const;
