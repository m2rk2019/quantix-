# Quantix Version 1 — Risk Register

| Field | Value |
|-------|-------|
| **Audit date** | 2026-10-07 |
| **Scope** | Production readiness audit (read-only) |
| **Related** | [V1_PRODUCTION_CHECKLIST.md](./V1_PRODUCTION_CHECKLIST.md) |

Status values match the checklist: risks are opened for every **WARNING** and **FAIL**.

---

## Summary

| ID | Area | Status | Risk | Effort |
|----|------|--------|------|--------|
| R-001 | Authentication | FAIL | High | 2–4 days |
| R-002 | Project Management | WARNING | Medium | 0.5–1 day (+ R-001) |
| R-003 | WBS | WARNING | High* | 1–2 days |
| R-004 | Unit Rates / Project Rate Library | WARNING | Medium–High* | 1–3 days |
| R-005 | Estimate Summary | WARNING | Low–Medium | 0.5–1 day |
| R-006 | Tender Package | WARNING | Medium | 1 day |
| R-007 | Template Reuse Workflow | WARNING | Medium | 1–2 days |
| R-008 | Template Versioning | WARNING | Low–Medium | 1 day |
| R-009 | Roles & Permissions | WARNING | Medium | 2–3 days |
| R-010 | Error Handling | WARNING | Medium | 2–4 days |
| R-011 | Database Constraints / Ops checklist | WARNING | Medium | 1–3 days |
| R-012 | Performance | WARNING | Medium | 1–2 weeks |
| R-013 | Security (uploads, demo, API, RLS breadth) | WARNING | High | 3–7 days |
| R-014 | Backup and Recovery | WARNING | Medium | 1–3 days |

\*Risk escalates to **High** if `SUPABASE_SERVICE_ROLE_KEY` is present on the production host (RLS bypass surface); if absent, feature paths may fail (availability).

---

## R-001 — Authentication service-role contradiction

| Field | Detail |
|-------|--------|
| **Module** | Authentication |
| **Status** | FAIL |
| **Root cause** | Login profile ensure (`services/auth/ensure-user-profile.ts`) and other hot paths call `createAdminClient()`, which requires `SUPABASE_SERVICE_ROLE_KEY`. Deploy docs (`PRODUCTION_CHECKLIST.md`, `DEPLOYMENT_GUIDE.md`) instruct operators **not** to set that key on Vercel production. Either production login/provisioning breaks, or operators ship a full RLS-bypass key. Additionally, DB role helper can fall back to JWT `user_metadata` when profile resolution is incomplete. |
| **Risk level** | **High** |
| **Recommended fix** | Pick one coherent model: (A) allow a tightly scoped server-only service role solely for provisioning and document it as required, removing other admin fallbacks; or (B) provision users only via offline scripts and remove admin client from login/hot paths. Stop trusting `user_metadata.role` for authorization (DB + `app_metadata` only). |
| **Estimated effort** | 2–4 days |
| **Owner** | TBD |
| **Target** | Before production |

---

## R-002 — Project Management: QS permission drift + provisioning dependency

| Field | Detail |
|-------|--------|
| **Module** | Project Management |
| **Status** | WARNING |
| **Root cause** | App/RLS create roles exclude Quantity Surveyor; `AUTHORIZATION_V1.md` describes QS cross-project write including create. Create flows also depend on provisioned profiles (R-001). |
| **Risk level** | **Medium** |
| **Recommended fix** | Product decision: update docs to match code, or grant QS create in code+RLS. Close R-001 so create is reliable without ad-hoc service role. |
| **Estimated effort** | 0.5–1 day (docs/policy) after R-001 |
| **Owner** | TBD |

---

## R-003 — WBS soft-delete service-role fallback

| Field | Detail |
|-------|--------|
| **Module** | WBS |
| **Status** | WARNING |
| **Root cause** | `delete-wbs-node.ts` / bulk delete fall back to `createAdminClient()` when session UPDATE fails under RLS. Hides residual policy bugs and expands privilege if service role is deployed. |
| **Risk level** | **High** (with service role) / **Medium** (without — deletes fail) |
| **Recommended fix** | Reproduce delete under user JWT on production-like RLS; fix WITH CHECK; remove admin fallback. |
| **Estimated effort** | 1–2 days |
| **Owner** | TBD |

---

## R-004 — Project rate library SELECT breadth + admin sync

| Field | Detail |
|-------|--------|
| **Module** | Unit Rates |
| **Status** | WARNING |
| **Root cause** | SELECT policies allow authenticated users when a project exists (not ownership-aligned). Sync/import from company uses admin client. |
| **Risk level** | **Medium** (data exposure in multi-estimator tenancy) / **High** if service role required for sync |
| **Recommended fix** | Align SELECT with projects/BOQ ownership model; replace admin sync with user-session-safe RPC or authenticated upserts. |
| **Estimated effort** | 1–3 days |
| **Owner** | TBD |

---

## R-005 — Estimate Summary QS markup mismatch

| Field | Detail |
|-------|--------|
| **Module** | Estimate Summary |
| **Status** | WARNING |
| **Root cause** | Markup edit helpers exclude QS while authorization docs suggest QS estimate edit. Status lock may rely primarily on RLS/`project_details` rather than explicit service checks. |
| **Risk level** | **Low–Medium** |
| **Recommended fix** | Align permission matrix; enforce approved/archived immutability in service layer explicitly. |
| **Estimated effort** | 0.5–1 day |
| **Owner** | TBD |

---

## R-006 — Tender package authorization thinness

| Field | Detail |
|-------|--------|
| **Module** | Tender Package |
| **Status** | WARNING |
| **Root cause** | Generate path relies on auth + write RLS; SELECT policies are project-exists oriented; export routes may be reachable by any authenticated user who can resolve IDs. |
| **Risk level** | **Medium** |
| **Recommended fix** | Mirror projects ownership SELECT; deny viewers and lock approved/archived appropriately in `generateTenderSubmission`; harden export routes. |
| **Estimated effort** | 1 day |
| **Owner** | TBD |

---

## R-007 — Template reuse verify / migration coverage

| Field | Detail |
|-------|--------|
| **Module** | Template Reuse Workflow |
| **Status** | WARNING |
| **Root cause** | Feature and migrations exist (`20261007200000_*`, fix pack), but dedicated `npm run verify:…` E2E and phase4–8 fixer inclusion are incomplete. Environments may run without provenance columns. |
| **Risk level** | **Medium** |
| **Recommended fix** | Add verify script; include fix in apply list; confirm production migration applied. |
| **Estimated effort** | 1–2 days |
| **Owner** | TBD |

---

## R-008 — Template versioning operational verification

| Field | Detail |
|-------|--------|
| **Module** | Template Versioning |
| **Status** | WARNING |
| **Root cause** | App always INSERTs; immutability trigger exists (`20261007210000_*`). Automated verification of bump + overwrite prevention is thin. |
| **Risk level** | **Low–Medium** |
| **Recommended fix** | Script asserting v1.0→v1.1 insert, unique `(template_key, version)`, and UPDATE snapshot rejection. |
| **Estimated effort** | 1 day |
| **Owner** | TBD |

---

## R-009 — Roles & permissions: metadata fallback and docs drift

| Field | Detail |
|-------|--------|
| **Module** | Roles & Permissions |
| **Status** | WARNING |
| **Root cause** | Layered RBAC is real, but JWT/`user_metadata` role fallback and AUTHORIZATION vs code drift weaken “DB profile as source of truth.” Middleware only gates a subset of routes. |
| **Risk level** | **Medium** |
| **Recommended fix** | Single permission matrix; remove user-writable metadata role trust; document that server asserts + RLS are authoritative. |
| **Estimated effort** | 2–3 days |
| **Owner** | TBD |

---

## R-010 — Error handling leaks and logging inconsistency

| Field | Detail |
|-------|--------|
| **Module** | Error Handling |
| **Status** | WARNING |
| **Root cause** | Many actions return raw Postgres/Supabase `error.message` to clients; structured `logger` is underused vs `console.*`. |
| **Risk level** | **Medium** |
| **Recommended fix** | Central action error mapper (safe UI message + structured log); add root `app/error.tsx`; redact schema/RLS details. |
| **Estimated effort** | 2–4 days |
| **Owner** | TBD |

---

## R-011 — Stale migration checklist / artifact retention

| Field | Detail |
|-------|--------|
| **Module** | Database Constraints |
| **Status** | WARNING |
| **Root cause** | Core constraints are strong, but `PRODUCTION_CHECKLIST` migration cutoff predates Oct 2026 template/import/tender migrations. Import/tender store `content_base64` without soft-delete/purge policy. |
| **Risk level** | **Medium** |
| **Recommended fix** | Refresh ordered migration list through `20261007210000`; define retention/purge for job/export blobs; document soft-delete restore. |
| **Estimated effort** | 1–3 days |
| **Owner** | TBD |

---

## R-012 — BOQ / dashboard full-set loads

| Field | Detail |
|-------|--------|
| **Module** | Performance |
| **Status** | WARNING |
| **Root cause** | Default BOQ `wbs_order` loads all rows then pages in memory; executive dashboard aggregates large sets in process. Fine for pilot sizes; risk grows with 5k+ lines / many projects. |
| **Risk level** | **Medium** |
| **Recommended fix** | Materialized WBS order key or RPC pagination; DB-side dashboard aggregates; exercise large fixtures before go-live. |
| **Estimated effort** | 1–2 weeks |
| **Owner** | TBD |

---

## R-013 — Security hardening gaps

| Field | Detail |
|-------|--------|
| **Module** | Security |
| **Status** | WARNING |
| **Root cause** | No max size on `.xlsx` uploads (smart import + template reuse); full workbooks may be stored as base64; demo reset scripts are admin-callable; UAT/benchmark API routes lack explicit role checks beyond “authenticated”; no CI workflows; broad SELECT RLS assumes single tenant. |
| **Risk level** | **High** (combined) |
| **Recommended fix** | Enforce upload size/MIME limits; store large files in Storage with TTL if needed; disable demo routes in production; add role checks on admin APIs; introduce CI for `deploy:preflight` + import regression; formally accept single-tenant RLS or tighten. |
| **Estimated effort** | 3–7 days |
| **Owner** | TBD |

---

## R-014 — Backup automation and inventory gaps

| Field | Detail |
|-------|--------|
| **Module** | Backup and Recovery |
| **Status** | WARNING |
| **Root cause** | Strong written runbook, but no repo scripts for pre-migrate dump/verify; PITR enablement not evidenced; docs understate server-side Excel/blob storage for import/tender. |
| **Risk level** | **Medium** |
| **Recommended fix** | Enable/document Supabase PITR; add dump+verify scripts; update backup inventory; run restore drill once. |
| **Estimated effort** | 1–3 days |
| **Owner** | TBD |

---

## Accepted residual risks (PASS modules — monitor only)

| ID | Module | Residual note |
|----|--------|---------------|
| A-001 | Smart Excel Import | Broad `smart_import_jobs` SELECT — acceptable for single-tenant; revisit for multi-tenant |
| A-002 | BOQ | Read assert relies on project visibility — OK if projects SELECT remains correct |
| A-003 | Resource Library | Ensure later admin-only write migration is applied after earlier broader grants |
| A-004 | Historical Archive | Portfolio-wide SELECT by design |
| A-005 | Master Templates | Library-wide SELECT by design; versions immutable |
| A-006 | Audit History | Failed audit inserts are non-blocking — rare silent gaps |

---

## Risk treatment board

| Priority | IDs | Action before V1 production |
|----------|-----|-----------------------------|
| P0 | R-001 | Must fix or production is blocked |
| P1 | R-003, R-013 (uploads + demo + service role surface) | Fix or formal accept with compensating controls |
| P2 | R-004, R-006, R-007, R-009, R-011, R-014 | Fix or accept for single-tenant pilot |
| P3 | R-002, R-005, R-008, R-010, R-012 | Schedule for V1.1 / harden during pilot |

---

## Change log

| Date | Change |
|------|--------|
| 2026-10-07 | Initial register from V1 production readiness audit |
