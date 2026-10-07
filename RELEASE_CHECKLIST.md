# Quantix V1 — Release Candidate Checklist

**Review date:** 2026-06-25  
**Scope:** Sprints 1–7 (V1 production release)  
**Build:** `npm run build` · **Lint:** `npm run lint` · **Typecheck:** `npm run typecheck` · **RC verify:** `npm run rc:verify`

---

## 1. Sprint Feature Integration (1–6.9)

| Sprint | Module | Route | RC Status |
|--------|--------|-------|-----------|
| 1 | Auth (login, session, middleware) | `/login`, protected shell | ✅ Integrated |
| 2 | Dashboard, Projects list | `/dashboard`, `/projects` | ✅ Integrated |
| 2 | Create Project | `/projects/new` | ✅ Integrated |
| 3 | Project Details + tabs | `/projects/[id]` | ✅ Integrated |
| 4 | WBS tree (lazy load, CRUD, search) | `/projects/[id]/wbs` | ✅ Integrated |
| 5 | BOQ grid (virtual scroll, pagination) | `/projects/[id]/boq` | ✅ Integrated |
| 6 | Estimate Summary | `/projects/[id]/summary` | ✅ Integrated |
| 6.5 | Estimate Validation panel | Summary page | ✅ Integrated |
| 6.8 | Audit History | `/projects/[id]/audit` | ✅ Integrated |
| 6.9 | Performance (cache, pagination, offline UX) | All modules | ✅ Integrated |
| — | Excel Export | Summary page | ✅ Integrated |

**Tab order:** Overview → WBS → BOQ → Estimate Summary → Audit History

---

## 2. Code Quality (RC Cleanup)

| Item | Status | Notes |
|------|--------|-------|
| ESLint | ✅ Pass | `npm run lint` — zero warnings |
| TypeScript | ✅ Pass | `npm run typecheck` — zero errors |
| Production build | ✅ Pass | `npm run build` |
| Duplicate `canCreateProject` / `canCreateProjectRole` | ✅ Fixed | Single source in `types/project.ts` |
| Duplicate `updateProject` vs `updateProjectDetails` | ✅ Removed | `updateProject` deleted; details form is canonical |
| Unused `useDebounce` hook | ✅ Removed | Inline debounce in BOQ/WBS modules |
| `ProjectForm` edit mode (dead path) | ✅ Removed | Create-only form |
| `update-project.ts` renamed | ✅ Done | `delete-project.ts` (delete only) |
| Unused DB columns | ✅ None removed | All columns referenced in lifecycle/audit; per DATABASE_DESIGN_V1 additive-only rule |

---

## 3. Role Permissions (AUTHORIZATION_V1)

Verified in code: `types/project.ts`, `types/wbs.ts`, `lib/auth/permissions.ts`, `middleware.ts`, assert-*-access services.

| Capability | Super Admin | Admin | Estimator (own) | QS | Viewer |
|------------|:-----------:|:-----:|:---------------:|:--:|:------:|
| View projects | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create project | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit project metadata | ✅ | ✅ | ✅* | ✅* | ❌ |
| Edit WBS/BOQ | ✅ | ✅ | ✅* | ✅* | ❌ |
| Lifecycle: Start | ✅ | ✅ | ✅* | ✅ | ❌ |
| Lifecycle: Submit | ✅ | ✅ | ✅* | ✅ | ❌ |
| Lifecycle: Approve/Reject | ✅ | ✅ | ❌/❌ | ❌/✅ | ❌ |
| Lifecycle: Archive/Restore | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete project | ✅ | ✅ | ✅* | ✅ | ❌ |
| View Audit History | ✅ | ✅ | ✅* | ✅ | ✅ |
| Export Excel (gate only) | ✅ | ✅ | ✅* | ✅ | Hidden |

\*Own project only, subject to project status (draft/in_progress editable for estimator).

**Middleware:** `/projects/new` blocked for non-creators → `/unauthorized`.

---

## 4. Project Lifecycle (PROJECT_LIFECYCLE_V1)

| Rule | Implementation | RC Status |
|------|----------------|-----------|
| New projects start Draft | `create-project.ts` | ✅ |
| Draft → In Progress (start) | `transition-project-status.ts` | ✅ |
| In Progress → For Review (submit) | ✅ | ✅ |
| For Review → Approved | Admin/Super Admin only | ✅ |
| For Review → In Progress (reject) | QS/Admin+ with reason | ✅ |
| Approved → Archived | Admin/Super Admin | ✅ |
| Archived → Approved (restore) | Admin/Super Admin | ✅ |
| `submitted_at/by`, `approved_at/by`, `archived_at/by` | Set on transitions | ✅ |
| Estimator read-only in For Review | `canEditProjectMetadata` | ✅ |
| Approved/archived read-only (estimator) | ✅ | ✅ |
| Soft-delete excludes from lists | `deleted_at IS NULL` queries | ✅ |
| Delete blocked in For Review | `delete-project.ts` | ✅ |

---

## 5. Validation Rules (Sprint 6.5)

12 checks in `services/validation/validate-estimate.ts`:

| # | Check | Severity |
|---|-------|----------|
| 1 | Project details complete | Error/Warning |
| 2 | Client information complete | Error/Warning |
| 3 | WBS exists | Error |
| 4 | Every WBS node has BOQ items | Error/Warning |
| 5 | No orphan BOQ items | Error |
| 6 | Required units completed | Error |
| 7 | Quantity > 0 | Error |
| 8 | Rates ≥ 0 | Error |
| 9 | No duplicate BOQ items | Error |
| 10 | No blank descriptions | Error |
| 11 | Total amount matches calculations | Error |
| 12 | Estimate summary recalculates | Error/Warning |

**Export gate:** Disabled when critical errors exist (`validation.canExport`).

---

## 6. Audit Trail (Sprint 6.8)

| Event | Service | Status |
|-------|---------|--------|
| Project created | `create-project.ts` | ✅ |
| Project details / estimate settings | `update-project-details.ts` (field-level) | ✅ |
| Project deleted | `delete-project.ts` | ✅ |
| Lifecycle transitions | `transition-project-status.ts` | ✅ |
| BOQ create/update/delete | `create/update/delete-boq-item.ts` | ✅ |
| WBS create/update/delete/move/paste | WBS services | ✅ |
| Audit UI + filters | `AuditHistoryPanel` | ✅ |

**Storage:** `audit_log` with `project_id`, JSONB payload (`old_value`, `new_value`, `module`, `remarks`).

---

## 7. Calculations (COST_STRUCTURE_V1)

| Formula | Location | RC Status |
|---------|----------|-----------|
| Total Rate = sum of 5 rate columns | `lib/boq/calculations.ts` | ✅ `npm run rc:verify` |
| Total Amount = Qty × Total Rate | `lib/boq/calculations.ts` | ✅ |
| Direct Cost = SUM(boq total_amount) | SQL `sum_boq_total_amount` RPC | ✅ |
| Indirect = Direct × % | `lib/estimate/calculations.ts` | ✅ |
| Contingency = (Direct+Indirect) × % | ✅ | ✅ |
| Markup = (Direct+Indirect+Contingency) × % | ✅ | ✅ |
| VAT = (all above) × % | ✅ | ✅ |
| Grand Total = sum of components | ✅ | ✅ Verified: 143,451 on 100k direct sample |
| WBS rollup combined totals | `get-estimate-summary.ts` | ✅ |

---

## 8. Performance & Scale (Sprint 6.9)

| Target | Implementation | RC Status |
|--------|----------------|-----------|
| 1,000 WBS nodes | Lazy load + virtual scroll + cached tree index | ✅ Algorithm verified |
| 100,000 BOQ rows | 200-row pagination + infinite scroll + virtual grid | ✅ 500 pages verified |
| Instant WBS navigation | Lazy children + debounced search (300ms) | ✅ |
| Fast summary refresh | SQL aggregates + cache tags | ✅ |
| Project metadata cache | `getCachedProjectMetadata` | ✅ |
| Summary cache | `getCachedEstimateSummary` | ✅ |
| Skeleton loaders | BOQ, WBS, Summary | ✅ |
| Offline banner + retry | `ConnectivityBanner` | ✅ |
| Background refresh | `useBackgroundRefresh` | ✅ |

**Note:** Full 100k-row load test requires seeded Supabase environment (manual/staging).

---

## 9. Responsive & Mobile

| Area | Pattern | RC Status |
|------|---------|-----------|
| Project layout | `flex-col` → `lg:flex-row` | ✅ |
| Project tabs | `overflow-x-auto` horizontal scroll | ✅ |
| BOQ toolbar | `flex-col` → `xl:flex-row` | ✅ |
| BOQ grid | Horizontal scroll + virtual vertical scroll | ✅ |
| Summary panels | `grid` → `xl:grid-cols-2` stacked on mobile | ✅ |
| Audit table | Responsive table in scroll container | ✅ |
| Sidebar | Collapsible shell (`AppShell`) | ✅ |
| Skip link | App shell `#main-content` | ✅ |

**Manual test required:** Tablet (768px) and mobile (375px) on Chrome/Safari.

---

## 10. Security & Data

| Item | Status |
|------|--------|
| RLS on all tables | ✅ Migrations |
| Auth middleware on protected routes | ✅ |
| No secrets in source | ✅ `.env.local` gitignored |
| Soft-delete respected | ✅ |
| Audit log append-only | ✅ No update/delete policies |

---

## 11. Automated Commands

```bash
npm run lint          # ESLint — must pass
npm run typecheck     # TypeScript — must pass
npm run build         # Production build — must pass
npm run rc:verify     # Calculation + scale + permission spot checks
npm run lighthouse    # Optional — requires Chrome (Performance/A11y/BP ≥ 95%)
```

---

## 12. Pre-Deploy Checklist

See **[docs/DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md)** for the complete production checklist, rollback procedure, and deployment scripts.

- [ ] `npm run deploy:preflight` passes
- [ ] All migrations applied to staging/production Supabase
- [ ] Environment variables set on Vercel (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`)
- [ ] Smoke test: login → create project → WBS → BOQ → summary → validation → audit
- [ ] Cross-browser: Chrome, Edge, Firefox (latest 2 versions)
- [ ] Role matrix manual test with test accounts (5 roles)
- [ ] Large project seed test (optional staging): 1k WBS / 100k BOQ
- [ ] Lighthouse ≥ 95% on login + dashboard (local `npm start`)

---

## 13. Known RC Limitations

| Item | Status |
|------|--------|
| Excel Export | Implemented (Sprint 7) — `/api/projects/[id]/export` |
| Automated E2E tests | Manual checklist per DEVELOPMENT_GUIDE V1 |
| Password reset | Out of SRS V1 scope |
| `middleware` → `proxy` deprecation warning | Next.js 16 advisory — non-blocking |

---

## 13b. Quantix Import Engine v1.0 (Frozen)

| Item | Status |
|------|--------|
| Engine tagged | **Quantix Import Engine v1.0** (`1.0.0`) |
| Production standard | `docs/IMPORT_ENGINE_V1.md` |
| NIA fixture | PASS — `samples/NIA_Budgetary_Cost_Breakdown.xlsx` |
| STREVI fixture | PASS — `samples/STREVI_BCB_Breakdown.xlsx` |
| Regression gate | `npm run regression:import-engine-v1` (required before any importer change) |
| Policy | Do not modify importer unless production bug; no regression allowed |

---

## 14. RC Sign-Off

| Role | Name | Date | Approved |
|------|------|------|----------|
| Technical Lead | | | ☐ |
| Product Owner | | | ☐ |
| QA | | | ☐ |

---

*End of Release Candidate Checklist*
