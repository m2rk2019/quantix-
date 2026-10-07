# AI Smart Excel Import Engine (Phase 7)

Enterprise importer that builds a complete Quantix project from a Budgetary Cost Breakdown workbook.

## Production freeze — Quantix Import Engine v1.0

**Status: ACCEPTED / FROZEN (2026-10-05)**

- Standard: [`docs/IMPORT_ENGINE_V1.md`](./IMPORT_ENGINE_V1.md)
- Version marker: `lib/smart-import/engine-version.ts`
- Supported production patterns: **NIA** + **STREVI**
- Mandatory regression (no importer change without PASS):

```bash
npm run regression:import-engine-v1
```

Do **not** modify importer behavior unless a production bug is discovered.

## Official reference profile

**MCC Budgetary Cost Breakdown** (synthetic/dev reference)

- Sample workbook: `samples/MCC_Budgetary_Cost_Breakdown.xlsx`
- Profile key: `mcc_budgetary_cost_breakdown`
- Recognition is **content-based** (not worksheet names)

**Production acceptance fixtures (v1.0)**

- NIA: `samples/NIA_Budgetary_Cost_Breakdown.xlsx`
- STREVI: `samples/STREVI_BCB_Breakdown.xlsx`

## Apply schema

```sql
-- supabase/fixes/smart-excel-import-engine.sql
```

## UI

`/projects/import` (also linked from Create Project)

## Verify

```bash
npm run verify:smart-import
```

Report: `docs/SMART_IMPORT_E2E_REPORT.md`
