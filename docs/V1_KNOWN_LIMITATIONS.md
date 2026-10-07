# Quantix Version 1 — Known Limitations

| Field | Value |
|-------|-------|
| **Version** | 1.0.0 |
| **Audit date** | 2026-10-07 |
| **Related** | [V1_PRODUCTION_CHECKLIST.md](./V1_PRODUCTION_CHECKLIST.md) · [V1_RISK_REGISTER.md](./V1_RISK_REGISTER.md) · [V1_RELEASE_NOTES.md](./V1_RELEASE_NOTES.md) |

This document lists **intentional** V1 limitations and **audit-confirmed** residual constraints. Items marked **Risk** are also tracked in the Risk Register and may block production until accepted or fixed.

> Note: Older `KNOWN_LIMITATIONS.md` (2026-06) is superseded for V1 GA planning. Smart Excel Import and Master Templates **are** in V1; that older doc’s “No Excel import” / “No BOQ templates” statements are obsolete.

---

## 1. Deployment & tenancy

| Limitation | Detail | Planned / notes |
|------------|--------|-----------------|
| **Single company per deployment** | No multi-tenant company switching | V3 |
| **Broad SELECT RLS on some registries** | Master templates, historical knowledge, some import job rows readable by any authenticated user | Acceptable for single-tenant pilot; revisit for multi-tenant (Risk R-013) |
| **No CI workflows in repo** | Preflight and import regression are manual npm scripts | V1.1 ops hardening |
| **Service-role policy conflict** | Code paths need admin client; deploy docs forbid key on Vercel | **Must resolve before production** (Risk R-001) |

---

## 2. Authentication & users

| Limitation | Detail | Planned / notes |
|------------|--------|-----------------|
| **No self-registration** | Users provisioned by admin/script | V2 |
| **No SSO / OAuth** | Email/password (as configured) | V2 |
| **No in-app user admin UI** | Role changes via DB/scripts | V2 |
| **JWT metadata role fallback** | Possible when profile resolution incomplete | Should be removed (Risk R-009) |

---

## 3. Project & estimating workflow

| Limitation | Detail | Planned / notes |
|------------|--------|-----------------|
| **QS create/markup vs docs** | Code may deny QS create / markup while AUTHORIZATION docs claim broader rights | Align docs or code (Risk R-002 / R-005) |
| **No drag-and-drop WBS reorder** | Manual code/order edit | V1.5 |
| **No real-time co-editing** | Last write wins | V3 |
| **No comments / notifications** | Not in V1 | V2 |
| **Approved/archived lock** | Read-only by design | By design |
| **WBS delete may use admin fallback** | Masks RLS issues if service role present | Risk R-003 |

---

## 4. Smart Excel Import

| Limitation | Detail | Planned / notes |
|------------|--------|-----------------|
| **Frozen engine** | Behavior locked to Import Engine v1.0; NIA+STREVI only as regression fixtures | Change only with regression PASS + freeze process |
| **Profile coverage** | Optimized for MCC-style Budgetary Cost Breakdown patterns | Additional profiles = future engine versions |
| **No upload size cap** | `.xlsx` accepted by extension; large files risk timeouts/DB bloat | Risk R-013 |
| **Workbook may be stored as base64** | Smart import jobs retain content | Retention/purge policy needed (Risk R-011) |

---

## 5. Master Templates & reuse

| Limitation | Detail | Planned / notes |
|------------|--------|-----------------|
| **Save only from approved projects** | By design | By design |
| **Versions are immutable** | Always new version; never overwrite snapshot | By design |
| **Match confidence threshold** | Below threshold → Estimator Review; rates not reused | By design (`MATCH_REUSE_CONFIDENCE_THRESHOLD`) |
| **Source sheet provenance** | Primary BOQ sheet used when extractors do not emit per-row sheet (Import Engine freeze) | Future engine metadata |
| **Reuse/versioning verify scripts** | Not fully automated | Risk R-007 / R-008 |
| **Old projects without `source_master_template_version`** | Display may fall back to template row version | Backfill optional |

---

## 6. Export, tender & reporting

| Limitation | Detail | Planned / notes |
|------------|--------|-----------------|
| **Browser-dependent print PDF in some views** | Server tender PDF also exists for package flow | Clarify per surface |
| **Large export / tender builds** | Very large BOQs may approach serverless limits | Performance guide / V1.5 |
| **Tender SELECT openness** | Authenticated users with IDs may read more than ownership model implies | Risk R-006 |
| **Monthly cash placeholder** | Equal-spread placeholder where schedule not modeled | V2 cash flow |

---

## 7. Performance

| Limitation | Detail | Planned / notes |
|------------|--------|-----------------|
| **BOQ WBS-order sort** | Loads matching rows then pages in memory | Risk R-012 |
| **Executive dashboard** | Portfolio aggregation may load large BOQ sets | Risk R-012 |
| **Pilot sizing** | Designed for typical project sizes; validate at 5k+ BOQ lines before promising SLA | Load test before GA |

---

## 8. Backup & operations

| Limitation | Detail | Planned / notes |
|------------|--------|-----------------|
| **Manual backup reliance** | Runbook exists; automated dump scripts not in repo | Risk R-014 |
| **PITR must be enabled in Supabase project** | Not enforced by application code | Ops gate |
| **Soft-delete restore** | No end-user restore UI | Admin/SQL runbook |
| **Demo database reset** | Exists for demos; must not be enabled casually in production | Risk R-013 |

---

## 9. Testing & quality gates

| Limitation | Detail | Planned / notes |
|------------|--------|-----------------|
| **Few/no unit test files** | Reliance on verify scripts + Import Engine regression | Expand in V1.1 |
| **E2E not in CI** | Manual | Add CI for preflight + regression |
| **Stale legacy docs** | Older production checklist / known limitations may contradict V1 features | Prefer `V1_*` docs from this audit |

---

## 10. What is *not* a limitation (clarifications)

| Topic | Clarification |
|-------|---------------|
| Excel BCB import | **Supported** via Smart Excel Import (frozen v1.0) |
| Master / BOQ templates | **Supported** via Master Template library + versioning |
| Historical reuse | **Supported** via Historical Archive + template reuse |
| Estimate formula changes | Not casually changed in V1; estimating refresh paths exist |

---

## Acceptance of limitations

Pilot / staging deployments may accept WARNING-level limitations with written sign-off. **FAIL** items (Authentication service-role contradiction) must not be accepted for production GA without a documented alternate control that keeps login and RLS safe.

| Limitation cluster | Accepted for pilot? | Accepted for production GA? | Sign-off |
|--------------------|---------------------|-----------------------------|----------|
| Single-tenant SELECT breadth | Yes (typical) | Only if still single-tenant | |
| Manual CI / verify | Yes | Prefer no | |
| Performance at &lt;2k BOQ lines | Yes | Validate sizing | |
| R-001 service-role conflict | No | **No** | |

---

## Document history

| Date | Notes |
|------|-------|
| 2026-10-07 | Written from V1 production readiness audit; supersedes obsolete pilot statements for import/templates |
