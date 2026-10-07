# Quantix V1 Demo Seed Package

One-command demo environment for Quantix Version 1 estimating.

**Version:** 1.0.0  
**Import Engine:** unchanged (frozen v1.0 — analyze-only at seed time)

## Quick start

```bash
npm run seed:demo
```

Reset (wipe demo projects + company seed rows; demo users kept):

```bash
npm run reset:demo
```

Requires `.env.local` with:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## What gets seeded

| Entity | Detail |
|--------|--------|
| **NIA 4PH Rental Housing** | Approved · 450 BOQ · Import Engine WBS · estimate summary · tender package · project resources / unit rates |
| **STREVI Residences** | Draft · 505 BOQ · Import Engine WBS · complete resources / unit rates |
| **Sample Commercial Building** | Megawide pilot dataset as `QTX-PILOT-MEGAWIDE-001` (display name: Sample Commercial Building Demo Project) |
| **Company defaults** | Resource library, unit rates, master template, trade categories, units of measure |
| **Demo users** | Super Admin, Estimator, Reviewer, Approver, Viewer |

### Fixed project IDs

| Project | ID | Status |
|---------|----|--------|
| NIA | `d0e11111-1111-4111-a111-111111111101` | `approved` |
| STREVI | `d0e22222-2222-4222-a222-222222222201` | `draft` |
| Commercial | `e1a11111-1111-4111-a111-111111111101` | Megawide pilot |

### Import Engine goldens (source of truth)

Seeded BOQ totals and WBS trees come from frozen fixtures via **read-only** `analyzeSmartImportWorkbook` + `buildWbsFromBoq`:

| Fixture | BOQ leaves | Direct cost (PHP) | WBS nodes |
|---------|------------|-------------------|-----------|
| `samples/NIA_Budgetary_Cost_Breakdown.xlsx` | **450** | **351,522,209.41** | **107** |
| `samples/STREVI_BCB_Breakdown.xlsx` | **505** | **1,859,023,517.47** | **125** |

These match `docs/import-engine-v1/REGRESSION_GOLDENS.json`. The demo database is identical every successful `seed:demo` run for the same engine version and samples.

> Note: UI copy that cites “97 / 119” WBS nodes is a different rollup presentation. The seed stores the **engine-validated** WBS counts (107 / 125).

### Demo users

Password for all: `DemoSeed1!`

| Label | Email | App role |
|-------|-------|----------|
| Super Admin | `demo.superadmin@quantix.local` | `super_admin` |
| Estimator | `demo.estimator@quantix.local` | `estimator` |
| Reviewer | `demo.reviewer@quantix.local` | `quantity_surveyor` |
| Approver | `demo.approver@quantix.local` | `admin` |
| Viewer | `demo.viewer@quantix.local` | `viewer` |

### Company defaults

- **Trade categories:** Material, Labor, Equipment, Subcontract (`DEMO-MAT` / `DEMO-LAB` / …, ids `d0e90001-…`)
- **Units of measure:** m, m2, m3, kg, ton, pc, set, lot, ls, hr, day (`company_units`, codes `DEMO-*`)
- **Resource library / unit rates:** merged from NIA + STREVI resource sheets + Megawide commercial library
- **Master template:** `demo-nia-rental-housing` @ 1.0.0 from approved NIA (`d0e33333-…`)
- **Tender package:** NIA generated submission (`d0e44444-…`)

## Files

| Path | Role |
|------|------|
| `scripts/seed-demo.mjs` | `npm run seed:demo` entry |
| `scripts/reset-demo-database.mjs` | `npm run reset:demo` entry |
| `scripts/seed/demo-seed-ops.mjs` | Apply / reset logic |
| `scripts/seed/analyze-fixtures.mjs` | Read-only Import Engine analyze |
| `scripts/seed/demo-constants.mjs` | Fixed IDs, users, markups |
| `docs/demo-seed/SEED.sql` | Reference wipe + ID catalog |
| `docs/demo-seed/IMPORT_SNAPSHOTS.json` | Last analyze metrics (written by seed) |
| `docs/demo-seed/LAST_SEED_REPORT.json` | Last successful seed report |

## Acceptance checks

```bash
npm run seed:demo
npm run regression:import-engine-v1   # both fixtures PASS
npm run build                        # production build PASS
```

- One command creates the complete demo environment.
- Demo database is identical every time (fixed IDs + engine goldens).
- Import Engine source under `lib/smart-import/**` and `services/smart-import/**` is **not** modified.
- `load:demo` (Megawide-only) remains available; `seed:demo` includes Megawide plus NIA/STREVI/company/users.

## Safety

- Demo wipe targets only demo UUID prefixes (`d0e…`, `e1d…`) and the three fixed project IDs.
- Non-demo projects and non-demo library rows are left untouched.
- Do not point `seed:demo` at a production tenant with live data you cannot recreate.
