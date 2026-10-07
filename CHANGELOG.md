# Changelog

All notable milestones for Quantix are recorded in this file.

The format follows a Keep a Changelog–style structure. Version 1 estimating is **frozen** as of **1.0.0** (October 2026).

---

## [1.0.0] — October 2026

### Official Stable Release

Quantix Version 1.0.0 — official stable release of the cloud-based construction estimating platform.

### Platform & access

- Supabase Auth email/password login with provisioned `public.users` profiles
- Role-based access: Super Admin, Admin, Estimator, Quantity Surveyor, Viewer
- Protected app shell and middleware route enforcement
- Company settings and admin surfaces

### Projects & lifecycle

- Project create, update, soft-delete, and search/filter list
- Lifecycle: Draft → In Progress → For Review → Approved → Archived
- Project details with commercial markup settings (indirect, contingency, markup, VAT)
- Audit trail for key estimating actions

### Estimating core (frozen)

- **WBS** — hierarchical work breakdown with CRUD, soft-delete, and bulk delete
- **BOQ** — editable quantities and five-component unit rates with automatic totals
- **Resource Library** — company materials, labor, equipment, subcontract, suppliers, units, categories
- **Rate Library** — project rate library and per-item rate analysis
- **Estimate Summary** — direct cost plus markups through grand total; refresh and print views
- Excel export and validation gates for estimate integrity

### Smart Excel Import (Import Engine v1.0 — frozen)

- Budgetary Cost Breakdown workbook recognition and project bootstrap
- WBS / BOQ / resource extraction with reconciliation reporting
- Regression-locked fixtures:
  - **NIA** — 450 BOQ leaves; direct cost ₱351,522,209.41 — PASS
  - **STREVI** — 505 BOQ leaves; direct cost ₱1,859,023,517.47 — PASS
- Change control: no importer changes unless a production bug is found

### Tender Package

- Tender submission package generation
- PDF / Excel / ZIP export paths

### Master Templates

- Save approved project as master template
- Create project from template (WBS, BOQ, resources, rates, settings)
- Template reuse matching and Estimator Review for uncertain matches
- Immutable template versioning

### Historical archive & benchmarks

- Historical project capture on approve/archive
- Benchmark / knowledge surfaces for portfolio learning

### Manual Quantity Takeoff foundation (V1.1 module)

- Takeoff foundation delivered in separate V1.1 module paths (not part of frozen V1 estimating core)
- Drawing workspace, measurement engine, drawing intelligence, and BOQ quantity linking foundation
- Does not modify Import Engine or V1 estimating business logic

### Demo & release operations

- Demo seed package (`npm run seed:demo` / `npm run reset:demo`)
- Import Engine regression harness (`npm run regression:import-engine-v1`)
- Production build verification (`npm run build`) — PASS at release

### Known limitations (not in 1.0.0)

- AI Quantity Takeoff
- AI Estimator (productized)
- Procurement
- Contracts
- Cash Flow

### Freeze policy

Version 1 is frozen. Future development starts at **Version 1.1**.  
Import Engine remains unchanged unless production bugs are discovered.

---

## Pre-1.0.0 milestones (absorbed into 1.0.0)

Completed during Version 1 development and pilot hardening:

1. Foundation — auth, app shell, roles  
2. Dashboard & projects list  
3. Project create / details  
4. WBS tree  
5. BOQ & estimate summary  
6. Excel export, QA, pilot packaging  
7. Company resource library & rate analysis  
8. Validation, UAT tooling, formula audit  
9. Executive dashboard & company branding exports  
10. Historical benchmarks repository  
11. Smart Excel Import Engine v1.0 (NIA / STREVI)  
12. Tender submission package  
13. Master template import, reuse, and versioning  
14. Manual Quantity Takeoff foundation (V1.1 modules)  
15. Official stable release packaging (this tag)  

---

## Upcoming

### [1.1.0] — Planned

- Continued Manual Quantity Takeoff capability (separate modules)
- Future enhancements outside the frozen V1 estimating core

See also: [RELEASE.md](./RELEASE.md) · [docs/PRODUCT_ROADMAP.md](./docs/PRODUCT_ROADMAP.md)
