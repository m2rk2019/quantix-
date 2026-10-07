# Release Notes — Quantix V1 (Pilot)

| Field | Value |
|-------|-------|
| **Version** | 1.0.0-pilot |
| **Release date** | 2026-06-26 |
| **Status** | Pilot release |
| **Related** | [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md) · [PILOT_TEST_GUIDE.md](./PILOT_TEST_GUIDE.md) · [UAT_RESULTS.md](./UAT_RESULTS.md) |

Quantix V1 is a cloud-based construction estimating platform. This pilot release delivers a production-ready estimating core with validation, reporting, and admin tooling for quantity surveyors and estimators.

---

## Platform

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS |
| Hosting | Vercel |
| Auth & Database | Supabase Auth + PostgreSQL |
| Exports | ExcelJS (`.xlsx`), browser print (PDF) |

---

## Completed Modules

### Authentication & Authorization
- Email/password login with Supabase session cookies
- Role-based access: Super Admin, Admin, Estimator, Quantity Surveyor, Viewer
- Protected routes and middleware enforcement
- Unauthorized handling for restricted actions

### Dashboard
- Project overview with metrics and recent projects
- Executive dashboard with KPI cards, status distribution, and cost breakdown (Sprint 11)
- Executive Excel export and print view

### Projects
- Searchable, filterable project list with pagination
- Auto-generated project codes (`QTX-YYYY-######`)
- Five-stage lifecycle: Draft → In Progress → For Review → Approved → Archived
- Project details with estimate settings (OCM, contingency, profit, VAT)
- Soft delete and full audit trail

### Work Breakdown Structure (WBS)
- Unlimited-depth hierarchical tree
- CRUD with parent/child relationships
- Search and virtual scroll for large trees

### Bill of Quantities (BOQ)
- Inline-editable grid with five rate components
- Automatic total rate and total amount calculation
- WBS linkage, filtering, search, and pagination
- Category totals and validation integration

### Rate Library & Rate Analysis
- Company resource library: materials, labor, equipment, subcontract, suppliers, units, categories
- Per-BOQ-item rate analysis with library sync
- Manual rate overrides and duplicate detection

### Estimate Summary
- Direct cost, OCM, contingency, profit, VAT, grand total
- WBS rollup panel and refresh
- Markup editing (role-gated)
- 12-check validation panel with export gate

### AI Estimator (Sprint 10)
- Engineering knowledge engine with 10 modules
- Formula-based quantity suggestions
- Apply suggestions to BOQ lines (non-viewer roles)

### Excel Export
- Multi-sheet workbook: Project Info, Estimate Summary, WBS, BOQ
- Company branding (logo, header, footer, theme color)
- Validation gate and permission checks
- Audit logging on export

### PDF Export (Print)
- Print-optimized estimate summary (`/projects/[id]/summary/print`)
- Executive dashboard print view (`/dashboard/print`)
- Auto-print query parameter support

### Company Settings (Sprint 13)
- Admin branding: company name, logo, address, theme
- Default currency and percentage defaults for new projects
- Report header, footer, and signature block
- Applied to exports, prints, and dashboard

### Historical Benchmark (Sprint 14)
- Five completed-project archetypes (office, condo, warehouse, commercial, infrastructure)
- Validation center: estimated vs actual comparison
- Formula audit with drill-down
- CSV/Excel benchmark import
- Accuracy dashboard and Excel reports

### UAT Suite (Sprint 15A)
- Admin UAT hub at `/admin/uat`
- 98-scenario checklist across 16 modules
- Formula verification (manual vs system)
- Performance benchmarks (load, search, save, export, large BOQ)
- Automated verify orchestrator (`npm run verify:uat-suite`)
- Excel test reports

### Production Readiness (Sprint 13)
- Structured logging (`lib/logging/logger.ts`)
- Environment validation (`lib/env/validate.ts`)
- Error boundaries and 404 page
- Performance indexes and debounced search
- Deployment preflight and production checklist

---

## Database Migrations

16 migrations from `20260625120000_create_users_auth.sql` through `20260711120000_benchmark_sprint14.sql`.

Apply in order via Supabase SQL editor or CLI. List with:

```bash
npm run deploy:migrations
```

Optional seed data:
- `supabase/seed.sql` — base users
- `supabase/seed-demo-office-building.sql` — large demo project
- `supabase/seed-formula-validation-demo.sql` — formula validation project
- `supabase/seed-historical-benchmarks.sql` — five benchmark projects

---

## Verification

All automated gates pass:

```bash
npm run deploy:preflight    # env, typecheck, lint, build, rc:verify
npm run verify:uat-suite    # 7 automated UAT scripts
```

Individual scripts: `verify:estimating-engine`, `verify:rate-analysis`, `verify:ai-engineering`, `verify:executive-dashboard`, `verify:company-settings`, `verify:historical-benchmarks`.

---

## Documentation Index

| Document | Purpose |
|----------|---------|
| [PILOT_TEST_GUIDE.md](./PILOT_TEST_GUIDE.md) | How pilot users test and report issues |
| [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md) | Current limits and planned enhancements |
| [ISSUE_REPORT_TEMPLATE.md](./ISSUE_REPORT_TEMPLATE.md) | Structured bug report template |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Vercel + Supabase deployment |
| [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) | Pre-go-live checklist |
| [UAT_CHECKLIST.md](./UAT_CHECKLIST.md) | Manual UAT scenarios |

---

## Pilot Scope

This release is intended for **controlled pilot deployment** with a small group of estimators and quantity surveyors. It is not a general public release. See [PILOT_TEST_GUIDE.md](./PILOT_TEST_GUIDE.md) for testing instructions and [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md) for out-of-scope items.

---

*End of Document*
