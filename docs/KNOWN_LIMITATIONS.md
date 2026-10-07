# Known Limitations — Quantix V1 (Pilot)

| Field | Value |
|-------|-------|
| **Version** | 1.0.0-pilot |
| **Last Updated** | 2026-06-26 |
| **Related** | [RELEASE_NOTES_V1.md](./RELEASE_NOTES_V1.md) · [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md) |

This document lists intentional limitations in the V1 pilot release and planned future enhancements. These are not bugs unless behavior deviates from what is described here.

---

## 1. Export & Reporting

| Limitation | Detail | Planned |
|------------|--------|---------|
| **No native PDF generation** | PDF output uses browser print (`window.print()`). Layout depends on browser and print settings. | V1.5 — server-side PDF |
| **No Excel import (general)** | BOQ/WBS cannot be imported from Excel on standard project workflows. Benchmark admin import is the exception. | V1.5 — Excel import |
| **Monthly cash chart placeholder** | Estimate summary monthly cash distribution uses equal spread placeholder data, not actual schedule. | V2 — Cash flow module |
| **Large export timeout** | Projects with 5,000+ BOQ lines may approach Vercel function limits on export. | Performance tuning in V1.5 |

---

## 2. User & Access Management

| Limitation | Detail | Planned |
|------------|--------|---------|
| **No self-registration** | Users must be provisioned in Supabase Auth and `public.users` by an administrator. | V2 — Admin user management |
| **No SSO / OAuth** | Email/password only. | V2 |
| **No in-app user admin UI** | Role changes require database or script updates (`deploy:provision-user`). | V2 |
| **Single company** | One company profile per deployment. No multi-tenant company switching. | V3 — Multi-company |

---

## 3. Estimating Workflow

| Limitation | Detail | Planned |
|------------|--------|---------|
| **No drag-and-drop WBS reorder** | WBS nodes cannot be reordered by drag. Edit code/description manually. | V1.5 |
| **No WBS copy/paste between projects** | Each project WBS is independent. | V1.5 — Templates |
| **No revision comparison** | Cannot diff two estimate versions side-by-side. | V2 |
| **No BOQ templates library** | Standard BOQ templates not available at project level. | V1.5 |
| **Approved project lock** | Approved/Archived projects are read-only. Rejection returns to In Progress. | By design |

---

## 4. Collaboration & Real-Time

| Limitation | Detail | Planned |
|------------|--------|---------|
| **No real-time co-editing** | Multiple users editing the same BOQ may overwrite each other's changes. Refresh to see updates. | V3 |
| **No comments / annotations** | No threaded comments on BOQ lines or WBS nodes. | V2 |
| **No notifications** | No email or in-app alerts for status changes. | V2 |

---

## 5. AI Estimator

| Limitation | Detail | Planned |
|------------|--------|---------|
| **Rule-based engine** | AI Estimator uses formula templates, not LLM inference. | V3 — AI-assisted estimating |
| **No learning from project history** | Suggestions do not adapt from completed project actuals automatically. | V3 — Benchmarking integration |
| **Viewer exclusion** | Viewers cannot use AI Estimator. | By design |

---

## 6. Historical Benchmark

| Limitation | Detail | Planned |
|------------|--------|---------|
| **Admin-only import** | Benchmark data import restricted to admins. | By design for pilot |
| **Manual actuals required** | Actual quantities/costs must be supplied via import; no ERP integration. | V2 — Integrations |
| **Five seed archetypes** | Pre-built benchmarks cover five project types only. | Expand in V1.5 |

---

## 7. Technical & Operational

| Limitation | Detail | Planned |
|------------|--------|---------|
| **Supabase required** | No offline mode or local-only deployment. | Not planned for V1 |
| **Browser support** | Optimized for Chrome and Edge. Firefox and Safari supported but not primary test targets. | Expanded QA in V1.5 |
| **No mobile app** | Responsive web only; BOQ editing on small screens is functional but not optimized. | V3 — Mobile |
| **E2E scripts not in CI** | Playwright browser scripts exist but are manual-only (not wired to `npm run`). | V1.5 — CI integration |
| **Environment-specific SQL** | `supabase/provision-*.sql` and `fix-login-access.sql` are dev helpers, not migrations. | Document only |

---

## 8. Performance Targets

See [PERFORMANCE_GUIDE.md](./PERFORMANCE_GUIDE.md) for targets. Known constraints:

| Area | Target | Notes |
|------|--------|-------|
| Dashboard load | < 2 s | Depends on project count and network |
| BOQ grid (5k rows) | < 3 s initial load | Pagination mitigates; very large projects may feel slower |
| Excel export (1k lines) | < 30 s | Vercel `maxDuration` set to 300 s for export route |
| In-memory perf suite | All under threshold | Run at `/admin/uat` → Performance Tests |

---

## 9. Out of Scope (Not in V1)

Per [SRS_QUANTIX_V1.md](./SRS_QUANTIX_V1.md) and [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md):

- Procurement and purchase orders
- Contract management
- Cash flow forecasting (beyond placeholder chart)
- PlanSwift / BIM integration
- Billing and subscriptions
- Multi-currency conversion at line level
- Advanced scheduling (CPM, Gantt)

---

## 10. Reporting Issues

If behavior differs from documented limitations, file a report using [ISSUE_REPORT_TEMPLATE.md](./ISSUE_REPORT_TEMPLATE.md).

---

*End of Document*
