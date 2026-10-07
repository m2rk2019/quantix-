# Quantix Version 1 — Production Readiness Checklist

| Field | Value |
|-------|-------|
| **Product** | Quantix Estimating Platform |
| **Version** | 1.0.0 (production readiness audit) |
| **Audit date** | 2026-10-07 |
| **Scope** | Read-only audit — no features implemented, Import Engine / Master Template workflow / business logic not modified |
| **Overall verdict** | **NOT READY FOR PRODUCTION** |

Related documents:

- [V1_RISK_REGISTER.md](./V1_RISK_REGISTER.md)
- [V1_RELEASE_NOTES.md](./V1_RELEASE_NOTES.md)
- [V1_KNOWN_LIMITATIONS.md](./V1_KNOWN_LIMITATIONS.md)

---

## How to use this checklist

1. Confirm every **PASS** item still holds in the target environment (migrations applied, regression green).
2. Close or explicitly accept every **WARNING** / **FAIL** in the Risk Register before go-live.
3. Do **not** treat documentation PASS as a substitute for applying Oct 2026 migrations on the production database.

Status legend:

| Status | Meaning |
|--------|---------|
| **PASS** | Fit for V1 production with residual risk acceptable for single-tenant pilot |
| **WARNING** | Usable but must be mitigated, monitored, or formally accepted |
| **FAIL** | Blocks production go-live until remediated |

---

## Module audit summary

| # | Module | Status | Notes |
|---|--------|--------|-------|
| 1 | Authentication | **FAIL** | Runtime requires `SUPABASE_SERVICE_ROLE_KEY` for login provisioning; deploy docs forbid it on Vercel |
| 2 | Project Management | **WARNING** | Lifecycle solid; QS create-permission docs vs code mismatch; create depends on provisioned profile |
| 3 | Smart Excel Import | **PASS** | Import Engine v1.0 frozen; NIA+STREVI regression PASS (2026-10-07) |
| 4 | WBS | **WARNING** | Soft-delete + RLS present; service-role fallback on delete |
| 5 | BOQ | **PASS** | Soft-delete, RLS update fix, provenance columns for reuse |
| 6 | Resource Library | **PASS** | Admin-gated company library; soft-delete |
| 7 | Unit Rates | **WARNING** | Rate analysis works; project rate SELECT RLS broad; sync uses admin client |
| 8 | Estimate Summary | **WARNING** | Recalc paths exist; QS markup permission diverges from AUTH docs |
| 9 | Tender Package | **WARNING** | Generate/export works; SELECT RLS project-exists only; thin status guards |
| 10 | Historical Archive | **PASS** | Capture on approve/archive; single-tenant SELECT openness intentional |
| 11 | Master Templates | **PASS** | Approved-only save; snapshot copy on create-from-template |
| 12 | Template Reuse Workflow | **WARNING** | Implemented; verify/E2E coverage incomplete; migrations must be applied |
| 13 | Template Versioning | **WARNING** | Immutable versions + DB trigger; operational apply/verify incomplete |
| 14 | Audit History | **PASS** | Actor-scoped insert; project-scoped select |
| 15 | Roles & Permissions | **WARNING** | Layered RBAC exists; JWT `user_metadata` fallback; docs drift |
| 16 | Error Handling | **WARNING** | ActionResult pattern exists; raw DB errors often returned to UI |
| 17 | Database Constraints | **WARNING** | Strong FKs/CHECKs/soft-delete on core; artifact tables hard-delete; checklist stale |
| 18 | Performance | **WARNING** | Indexes + pagination exist; BOQ `wbs_order` loads full set; dashboard unbounded |
| 19 | Security | **WARNING** | Middleware + RLS + no XSS sinks; upload size unlimited; service_role conflict; no CI |
| 20 | Backup and Recovery | **WARNING** | Written runbook; no automated dump scripts; PITR not gated; blob inventory incomplete |

**Counts:** PASS 6 · WARNING 13 · FAIL 1

---

## 1. Authentication — FAIL

| Check | Result |
|-------|--------|
| Login UI + magic/password flows | Present |
| Middleware session gate | Present (`middleware.ts`) |
| Inactive / soft-deleted user sign-out | Present |
| Profile provisioning | Uses `createAdminClient()` → requires service role |
| Deploy policy | Docs: **do not** set `SUPABASE_SERVICE_ROLE_KEY` on Vercel |
| JWT role fallback | `current_user_role()` may fall back to metadata |

**Gate:** Resolve service-role policy vs login provisioning before production.

---

## 2. Project Management — WARNING

| Check | Result |
|-------|--------|
| Create / update / soft-delete | Present |
| Status transitions | Present (`draft` → … → `approved` / `archived`) |
| Ownership (`created_by`) | Present |
| App + RLS create roles | Estimator/admin/super_admin (QS excluded in code) |
| Spec alignment (`AUTHORIZATION_V1`) | QS create claimed in docs — mismatch |

---

## 3. Smart Excel Import — PASS

| Check | Result |
|-------|--------|
| Analyze + import pipeline | Present |
| Frozen engine | `Quantix Import Engine v1.0` (`1.0.0`, freeze 2026-10-05) |
| Regression | `npm run regression:import-engine-v1` — **OVERALL PASS** |
| Goldens | NIA 450 leaves / STREVI 505 leaves |
| Cursor freeze rule | `.cursor/rules/import-engine-v1-freeze.mdc` |

**Pre-release gate:** Re-run regression on release candidate build; confirm freeze docs unchanged.

---

## 4. WBS — WARNING

| Check | Result |
|-------|--------|
| CRUD + soft-delete | Present |
| Soft-delete RLS WITH CHECK | Present |
| Bulk delete | Present + verify scripts |
| Service-role fallback on delete | Present — production risk |

---

## 5. BOQ — PASS

| Check | Result |
|-------|--------|
| Grid CRUD + soft-delete | Present |
| Update RLS WITH CHECK fix | Present |
| Totals RPCs | Present |
| Import provenance columns | Present (reuse workflow migration) |

---

## 6. Resource Library — PASS

| Check | Result |
|-------|--------|
| Company materials/labor/equipment/subcontract | Present |
| Admin-only manage | Present (later migration tightens writes) |
| Soft-delete | Present |

---

## 7. Unit Rates — WARNING

| Check | Result |
|-------|--------|
| Rate analysis lines | Present |
| Project rate library | Present |
| Sync/import from company | Uses admin client |
| SELECT RLS ownership | Broad (project exists) |

---

## 8. Estimate Summary — WARNING

| Check | Result |
|-------|--------|
| Direct cost / markups refresh | Present |
| Soft-deleted lines excluded | Present |
| QS markup edit | Denied in code; docs may claim otherwise |

---

## 9. Tender Package — WARNING

| Check | Result |
|-------|--------|
| Snapshot + PDF/Excel/ZIP | Present |
| Verify script | `verify:tender-submission` |
| App-layer viewer/status guard | Thin |
| SELECT RLS | Project-exists (not ownership) |

---

## 10. Historical Archive — PASS

| Check | Result |
|-------|--------|
| Capture on approve/archive | Present |
| Knowledge / search | Present |
| Single-tenant SELECT | Intentional |

---

## 11. Master Templates — PASS

| Check | Result |
|-------|--------|
| Save from approved projects only | Present |
| Create project from template | Copies WBS/BOQ/resources/settings |
| Source project unchanged | Snapshot model |

---

## 12. Template Reuse Workflow — WARNING

| Check | Result |
|-------|--------|
| Deterministic match engine | Present |
| Confidence threshold / no uncertain rate reuse | Present |
| Template Reuse Report | Present |
| Dedicated verify script | Missing |
| Migration applied in all envs | Must be confirmed operationally |

---

## 13. Template Versioning — WARNING

| Check | Result |
|-------|--------|
| `template_version`, `created_from_project_id`, `created_at`, `created_by` | Present |
| Always INSERT new version | Present |
| Immutability trigger | Present |
| Project stores `source_master_template_id` + `_version` | Present |
| Dedicated verify script | Thin / missing |

---

## 14. Audit History — PASS

| Check | Result |
|-------|--------|
| Insert with actor | Present |
| Project-scoped list | Present |
| Wired from lifecycle / BOQ / templates | Present |

---

## 15. Roles & Permissions — WARNING

| Check | Result |
|-------|--------|
| Role enum + helpers | Present |
| Middleware route gates (admin / create / templates) | Present |
| Server asserts + RLS | Primary enforcement |
| Docs vs code (QS) | Drift |
| In-app user admin UI | Not present (known limitation) |

---

## 16. Error Handling — WARNING

| Check | Result |
|-------|--------|
| `ActionResult` pattern | Common |
| Shell `error.tsx` | Present |
| Structured logger | Present but lightly used |
| Raw Supabase `error.message` to UI | Common |

---

## 17. Database Constraints — WARNING

| Check | Result |
|-------|--------|
| Core FK / CHECK / soft-delete | Strong |
| Master template version uniqueness | `(template_key, template_version)` |
| Smart import / tender blob retention | Hard rows + `content_base64` |
| Production checklist migration cutoff | Stale (stops before Oct 2026) |

---

## 18. Performance — WARNING

| Check | Result |
|-------|--------|
| Indexes on projects/WBS/BOQ | Present |
| BOQ UI page size | 200 |
| BOQ `wbs_order` query | Loads all matching rows then slices |
| Executive dashboard | Large in-memory aggregation |
| CI performance budgets | Not automated |

---

## 19. Security — WARNING

| Check | Result |
|-------|--------|
| Anon key only in browser | Present |
| No `dangerouslySetInnerHTML` / `eval` found | Pass |
| `.env*` gitignored | Present |
| Upload size limits on Excel import | Missing |
| Demo reset routes | Admin-gated but dangerous if enabled in prod |
| GitHub Actions / CI | Not found |
| Broad SELECT RLS (templates, historical, import jobs) | Acceptable only for single-tenant |

---

## 20. Backup and Recovery — WARNING

| Check | Result |
|-------|--------|
| Written backup/PITR runbook | Present (`DEPLOYMENT_GUIDE`) |
| Automated pre-migrate dump script | Missing |
| PITR enabled (ops confirmation) | Not evidenced in repo |
| Blob backup inventory (import/tender base64) | Docs incomplete |
| Release regression in CI | Manual only |

---

## Pre-production gates (must close)

1. **[FAIL]** Decide and implement a coherent `SUPABASE_SERVICE_ROLE_KEY` policy for login provisioning (and remove or isolate WBS/rate admin fallbacks).
2. **[High]** Apply all migrations through `20261007210000_master_template_versioning.sql` (and matching fixes) on production DB; update checklist.
3. **[High]** Re-run `npm run regression:import-engine-v1` on the release candidate — must remain PASS.
4. **[Medium]** Add upload size limits for `.xlsx` imports; disable demo reset in production.
5. **[Medium]** Confirm Supabase PITR / backup schedule; record RPO/RTO owners.
6. **[Medium]** Formally accept single-tenant SELECT openness **or** tighten RLS for estimator ownership.
7. **[Medium]** Align `AUTHORIZATION_V1` with code for QS create/markup **or** change code (product decision).
8. **[Low–Medium]** Add verify coverage for template reuse + versioning; wire CI for preflight + import regression.

---

## Environment readiness checklist

- [ ] Production Supabase project created; migrations applied through **20261007210000**
- [ ] Fix packs applied if migrations were partially applied historically (`supabase/fixes/*`)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` / anon key set on host
- [ ] Service-role decision documented and implemented (see Risk R-001)
- [ ] At least one provisioned `super_admin` / `admin` user verified
- [ ] Import Engine regression PASS on RC
- [ ] Smoke: login → create project → smart import → BOQ → estimate → approve → save template → create from template → reuse import
- [ ] Smoke: tender generate + download
- [ ] Smoke: historical archive after approve
- [ ] Backup/PITR confirmed
- [ ] Demo/reset routes disabled or admin-only behind feature flag

---

## Sign-off

| Role | Name | Date | Decision |
|------|------|------|----------|
| Product Owner | | | |
| Tech Lead | | | |
| Security Reviewer | | | |

**Current audit recommendation:** Do **not** sign off for production until R-001 (Authentication FAIL) is closed and High risks in the Risk Register are mitigated or formally accepted with compensating controls.
