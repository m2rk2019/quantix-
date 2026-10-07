# User Acceptance Testing Plan — Quantix V1

| Field | Value |
|-------|-------|
| **Document** | UAT_PLAN |
| **Product** | Quantix |
| **Version** | 1.0 |
| **Status** | Ready for Execution |
| **Last Updated** | 2026-06-25 |
| **Related** | [SRS_QUANTIX_V1.md](./SRS_QUANTIX_V1.md) · [UAT_CHECKLIST.md](./UAT_CHECKLIST.md) · [UAT_BUG_TRACKER.md](./UAT_BUG_TRACKER.md) · [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) · [RELEASE_CHECKLIST.md](../RELEASE_CHECKLIST.md) |

---

## 1. Purpose

This plan defines how **business users** validate Quantix V1 before production go-live. UAT confirms that the delivered application meets functional, authorization, and workflow requirements described in the SRS and supporting specifications — from the perspective of estimators, quantity surveyors, administrators, and read-only stakeholders.

UAT is **manual and checklist-driven** (per DEVELOPMENT_GUIDE). No new features are developed during UAT; defects are logged in [UAT_BUG_TRACKER.md](./UAT_BUG_TRACKER.md) and triaged for fix or deferral.

---

## 2. Scope

### 2.1 In Scope — V1 Modules

| Module | Route(s) | UAT focus |
|--------|----------|-----------|
| Login | `/login` | Authentication, session, error handling |
| Dashboard | `/dashboard` | Metrics, navigation, recent projects |
| Projects | `/projects` | List, search, filter, sort, pagination |
| Create Project | `/projects/new` | Form validation, project code, lifecycle start |
| Project Details | `/projects/[id]` | Metadata, estimate settings, tabs, lifecycle actions |
| WBS | `/projects/[id]/wbs` | Tree CRUD, hierarchy, search, permissions |
| BOQ | `/projects/[id]/boq` | Inline edit, rates, totals, pagination, WBS filter |
| Estimate Summary | `/projects/[id]/summary` | Cost breakdown, WBS rollup, refresh |
| Validation | Summary page (panel) | 12 checks, export gate |
| Audit Trail | `/projects/[id]/audit` | Event history, filters |
| Excel Export | Summary page + API | Workbook structure, permissions, audit |

### 2.2 Out of Scope

- Version 2 features (AI, Procurement, Contracts, PlanSwift, import from Excel)
- User self-registration and password reset flows
- Admin user-management UI (users provisioned via Supabase / ops scripts)
- Automated E2E test suite creation
- Performance benchmarking beyond agreed smoke scenarios
- Penetration testing (separate security review if required)

---

## 3. Objectives

UAT is successful when:

1. All **critical** and **high** severity defects are resolved or formally accepted with mitigation.
2. **100%** of checklist scenarios marked **Pass** or **Pass with observation** (non-blocking, documented).
3. Each role in the permission matrix has been exercised on at least one scenario.
4. Business stakeholders sign off using the template in Section 10.

---

## 4. Test Environment

| Item | Requirement |
|------|-------------|
| **URL** | Staging or UAT Vercel preview connected to **non-production** Supabase (recommended) or dedicated UAT Supabase project |
| **Data** | Fresh UAT dataset: minimum 2 projects (one small, one medium), 3+ WBS levels, 50+ BOQ lines |
| **Browsers** | Chrome, Microsoft Edge, Firefox — latest 2 versions each |
| **Viewports** | Desktop 1280px+, tablet 768px, mobile 375px (spot checks) |
| **Build** | Tagged release candidate (e.g. `v1.0.0-rc1`) with all migrations applied |

**Pre-UAT gate (technical):**

```bash
npm run deploy:preflight
```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for environment setup.

---

## 5. Test Accounts

Provision one active account per role before UAT (see DEPLOYMENT_GUIDE §3.4):

| Role | Code | Suggested test email | Primary UAT use |
|------|------|---------------------|-----------------|
| Super Admin | `super_admin` | `uat-superadmin@company.com` | Full access, lifecycle approve/archive |
| Admin | `admin` | `uat-admin@company.com` | Cross-project edit, approve |
| Estimator | `estimator` | `uat-estimator@company.com` | Own-project estimating workflow |
| Quantity Surveyor | `quantity_surveyor` | `uat-qs@company.com` | Cross-project review, reject |
| Viewer | `viewer` | `uat-viewer@company.com` | Read-only verification |

**Test data ownership:** The Estimator account should **own** at least one project (`created_by`). Admin/QS should access projects they did not create.

---

## 6. Pass / Fail Criteria

### 6.1 Scenario-Level (per row in UAT_CHECKLIST)

| Result | Code | Criteria |
|--------|------|----------|
| **Pass** | P | Actual result matches expected result; no defect logged |
| **Pass with observation** | PO | Minor cosmetic or documentation gap; does not block workflow; logged as Low/Info in bug tracker |
| **Fail** | F | Actual result differs from expected; defect logged with severity |
| **Blocked** | B | Scenario cannot run (environment down, missing data, upstream failure) |
| **Not tested** | NT | Explicitly skipped with reason |

A scenario **Pass** requires all numbered expected results to be met.

### 6.2 Module-Level

| Result | Criteria |
|--------|----------|
| **Module Pass** | ≥ 95% of scenarios Pass or PO; zero open Critical/High defects for that module |
| **Module Fail** | Any open Critical defect, or &lt; 95% Pass/PO |

### 6.3 UAT Exit (Release Decision)

| Decision | Criteria |
|----------|----------|
| **Go** | All modules Pass; zero open Critical/High defects; sign-off complete |
| **Conditional Go** | All Critical fixed; High defects have agreed workaround and fix date; sign-off with conditions |
| **No-Go** | Any open Critical defect, or business sign-off withheld |

---

## 7. Defect Severity

Use these definitions when logging defects in [UAT_BUG_TRACKER.md](./UAT_BUG_TRACKER.md):

| Severity | Code | Definition | Examples | Target resolution |
|----------|------|------------|----------|-------------------|
| **Critical** | S1 | Data loss, security breach, complete feature unusable, wrong financial totals in production path | Grand total off by calculation; viewer can edit BOQ; export shows another project's data | Block release; fix before go-live |
| **High** | S2 | Major feature broken with no workaround | Cannot submit for review; WBS delete corrupts tree; export fails for valid project | Fix before go-live |
| **Medium** | S3 | Feature partially broken; workaround exists | Search filter ignores status; audit filter date range wrong | Fix in patch or accept with date |
| **Low** | S4 | Minor functional or UI issue | Misaligned column; typo in label; slow but acceptable load | Backlog |
| **Info** | S5 | Enhancement or documentation only | Wording preference; future UX idea | Backlog / V2 |

**Priority vs severity:** Severity reflects user impact; priority reflects fix order (set by Product Owner).

---

## 8. Test Execution Process

```
Prepare environment → Execute UAT_CHECKLIST → Log defects → Retest fixes → Sign-off
```

| Step | Action | Owner |
|------|--------|-------|
| 1 | Confirm UAT environment and accounts ready | DevOps / Tech Lead |
| 2 | Walkthrough with Estimator + QS (happy path) | Product Owner |
| 3 | Execute full checklist per module | QA / Business testers |
| 4 | Log failures in bug tracker with steps to reproduce | Tester |
| 5 | Triage defects daily (severity, assignee, target) | Product Owner + Tech Lead |
| 6 | Deploy fixes to UAT; mark defects **Retest** | Development |
| 7 | Regression on failed scenarios + smoke on related modules | QA |
| 8 | Complete sign-off template (Section 10) | Business stakeholders |

**Traceability:** Each defect references one or more checklist IDs (e.g. `UAT-BOQ-004`).

---

## 9. Roles and Responsibilities

| Role | Responsibility |
|------|----------------|
| **Product Owner** | UAT scope, defect triage, accept/defer, final go/no-go |
| **Business testers** | Execute scenarios; represent estimator/QS/admin workflows |
| **QA lead** | Checklist maintenance, results collation, regression coordination |
| **Technical lead** | Environment support, defect fixes, retest builds |
| **DevOps** | UAT deployment, accounts, backups |

---

## 10. User Sign-Off Template

Complete after UAT execution and defect triage.

---

### Quantix V1 — User Acceptance Sign-Off

| Field | Value |
|-------|-------|
| **Application** | Quantix V1 |
| **UAT environment URL** | |
| **Build / tag tested** | |
| **UAT period** | From: ________ To: ________ |

#### Test Summary

| Module | Scenarios | Pass | Pass (obs.) | Fail | Blocked | Module result |
|--------|-----------|------|-------------|------|---------|---------------|
| Login | | | | | | ☐ Pass ☐ Fail |
| Dashboard | | | | | | ☐ Pass ☐ Fail |
| Projects | | | | | | ☐ Pass ☐ Fail |
| Create Project | | | | | | ☐ Pass ☐ Fail |
| Project Details | | | | | | ☐ Pass ☐ Fail |
| WBS | | | | | | ☐ Pass ☐ Fail |
| BOQ | | | | | | ☐ Pass ☐ Fail |
| Estimate Summary | | | | | | ☐ Pass ☐ Fail |
| Validation | | | | | | ☐ Pass ☐ Fail |
| Audit Trail | | | | | | ☐ Pass ☐ Fail |
| Excel Export | | | | | | ☐ Pass ☐ Fail |

#### Defect Summary at Sign-Off

| Severity | Open | Accepted (deferred) | Closed |
|----------|------|-------------------|--------|
| Critical (S1) | | | |
| High (S2) | | | |
| Medium (S3) | | | |
| Low (S4) | | | |

#### Decision

☐ **Approved for production release** — All acceptance criteria met.  
☐ **Approved with conditions** — List conditions:  
_____________________________________________________________________________  
☐ **Not approved** — Reason:  
_____________________________________________________________________________

#### Approvals

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Commercial / Estimating lead | | | |
| Quantity Surveyor lead | | | |
| IT / Technical lead | | | |

---

## 11. References

| Document | Use in UAT |
|----------|------------|
| [SRS_QUANTIX_V1.md](./SRS_QUANTIX_V1.md) | Functional requirements and acceptance criteria |
| [AUTHORIZATION_V1.md](./AUTHORIZATION_V1.md) | Role permissions |
| [PROJECT_LIFECYCLE_V1.md](./PROJECT_LIFECYCLE_V1.md) | Status transitions |
| [COST_STRUCTURE_V1.md](./COST_STRUCTURE_V1.md) | BOQ and estimate calculations |
| [UI_SPEC_V1.md](./UI_SPEC_V1.md) | Layout, export filename, responsive behaviour |
| [UAT_CHECKLIST.md](./UAT_CHECKLIST.md) | Executable test scenarios |
| [UAT_BUG_TRACKER.md](./UAT_BUG_TRACKER.md) | Defect log |

---

## 12. Schedule (Suggested)

| Day | Activity |
|-----|----------|
| Day 1 | Environment setup; Login, Dashboard, Projects |
| Day 2 | Create Project, Project Details, lifecycle |
| Day 3 | WBS, BOQ (core editing) |
| Day 4 | Estimate Summary, Validation, Excel Export |
| Day 5 | Audit Trail; role matrix; responsive spot checks |
| Day 6 | Defect retest; regression smoke |
| Day 7 | Sign-off review meeting |

Adjust duration based on team size. A single estimator + QS pair typically requires 3–5 business days for full checklist execution.

---

*End of Document*
