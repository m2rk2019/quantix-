# Quantix Version 1 — Release Notes

| Field | Value |
|-------|-------|
| **Version** | 1.0.0 |
| **Codename** | Quantix Version 1 |
| **Release candidate audit** | 2026-10-07 |
| **Import Engine** | Quantix Import Engine v1.0 (`1.0.0`, frozen 2026-10-05) |
| **Production readiness** | **NOT READY** — see [V1_PRODUCTION_CHECKLIST.md](./V1_PRODUCTION_CHECKLIST.md) |

These notes describe what Version 1 **contains**. They do not authorize production deployment until P0 risks are closed.

---

## Highlights

Quantix V1 is a full estimating platform for construction cost teams:

- Authenticated multi-role workspace (Super Admin, Admin, Estimator, Quantity Surveyor, Viewer)
- Project lifecycle from draft through approval and historical archive
- Frozen Smart Excel Import Engine (NIA + STREVI goldens)
- WBS, BOQ, company/project rate libraries, rate analysis
- Estimate summary with markups and tender package export
- Master Templates with deterministic reuse matching and immutable versioning
- Audit trail across estimating actions

---

## What's included

### Platform & access

- Email/password (and configured auth) login with provisioned `public.users` profiles
- Middleware route protection for authenticated shell
- Role helpers for create, edit, admin, and viewer behaviors
- Company settings and resource library (admin-managed)

### Estimating core

- Project create / update / soft-delete / status transitions
- WBS hierarchy with soft-delete and bulk delete
- BOQ grid with category rates, totals, undo/redo patterns, WBS-tree display order
- Project rate library and rate analysis lines
- Estimate summary refresh (direct cost + commercial markups)

### Smart Excel Import (frozen)

- Budgetary Cost Breakdown workbook recognition
- WBS/BOQ/resource extraction and project bootstrap
- Import reconciliation reporting
- **Regression-locked** on:
  - NIA — 450 leaves, direct-cost total ₱351,522,209.41
  - STREVI — 505 leaves, direct-cost total ₱1,859,023,517.47
- Last recorded regression: **OVERALL PASS** (2026-10-07)

### Tender & historical

- Tender submission package (PDF / Excel / ZIP)
- Historical projects repository capture on approve/archive
- Benchmark / knowledge surfaces for portfolio learning

### Master Template Workflow (V1 final major feature)

1. Save **approved** project as Master Template  
2. Library of reusable templates  
3. Create new project from a template (copies WBS, BOQ, resources, rates, settings)  
4. Import new Excel BCB against the pinned template  
5. Deterministic match (item code → description → unit → WBS → similarity)  
6. Rate reuse only above confidence threshold; uncertain/new → Estimator Review  
7. Template Reuse Report  
8. Immutable **template versioning** (`1.0` → `1.1` → `1.2`); projects store `source_master_template_id` + `source_master_template_version`

### Audit

- Project-scoped audit history with actor, action, and payloads for key mutations

---

## Explicit non-goals for this release candidate

- Multi-company / multi-tenant SaaS isolation
- Self-registration / SSO
- In-app user administration UI
- Real-time co-editing
- Changing Import Engine v1 extractors or goldens
- Automatic remediation of production-readiness findings (audit-only)

---

## Upgrade / migration notes

Operators must apply migrations through at least:

- `20261005130000_historical_projects_repository.sql`
- `20261005140000_tender_submission_package.sql`
- `20261005150000_smart_excel_import_engine.sql`
- `20261005160000_master_template_import_workflow.sql`
- `20261007200000_master_template_reuse_workflow.sql`
- `20261007210000_master_template_versioning.sql`

Idempotent fix packs (if needed):

- `supabase/fixes/master-template-reuse-workflow.sql`
- `supabase/fixes/master-template-versioning.sql`

**Do not** skip Import Engine regression after any importer-adjacent change:

```bash
npm run regression:import-engine-v1
```

---

## Verification commands (release candidate)

| Area | Command |
|------|---------|
| Import Engine freeze | `npm run regression:import-engine-v1` |
| Deploy preflight | `npm run deploy:preflight` |
| Tender | `npm run verify:tender-submission` |
| Smart import | `npm run verify:smart-import` |
| Master template (base) | `npm run verify:master-template-import` |
| Project rate library | `npm run verify:project-rate-library-e2e` |
| Estimating engine | `npm run verify:estimating-engine` |

Template reuse + versioning still need dedicated automated verifies (tracked as risks R-007 / R-008).

---

## Known blockers for production tag

See Risk Register P0/P1:

1. Authentication service-role vs Vercel policy contradiction (**FAIL**)
2. WBS/rate admin fallbacks and upload/demo hardening
3. Confirm migrations + PITR/backups on the production project

Until those are closed, Version 1 should remain a **pilot / staging** release candidate, not a production GA tag.

---

## Credits / freeze markers

| Component | Marker |
|-----------|--------|
| Import Engine | `lib/smart-import/engine-version.ts` — `1.0.0` |
| Freeze rule | `.cursor/rules/import-engine-v1-freeze.mdc` |
| Goldens | `docs/import-engine-v1/REGRESSION_GOLDENS.json` |
| Last regression | `docs/import-engine-v1/REGRESSION_LAST_RUN.json` |

---

## Document history

| Date | Notes |
|------|-------|
| 2026-10-07 | Release notes generated from V1 production readiness audit |
