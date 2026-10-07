# Pilot Test Guide — Quantix V1

| Field | Value |
|-------|-------|
| **Version** | 1.0.0-pilot |
| **Audience** | Pilot users (estimators, quantity surveyors, admins) |
| **Related** | [DEMO_PROJECT_DESCRIPTION.md](./DEMO_PROJECT_DESCRIPTION.md) · [UAT_CHECKLIST.md](./UAT_CHECKLIST.md) · [ISSUE_REPORT_TEMPLATE.md](./ISSUE_REPORT_TEMPLATE.md) · [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md) |

This guide explains how pilot users should test Quantix, what to expect, and how to report issues.

---

## 0. Local Pilot Setup (Admins)

Before pilot users begin, load the **Megawide Office Building** demo project.

### Prerequisites

- Supabase migrations applied
- At least one user provisioned (`npm run deploy:provision-user`)
- `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`

### One-click load (recommended)

1. Log in as **Admin**
2. Open **`/admin/demo`**
3. Click **Load Demo Project**
4. Wait for success message (~30–60 seconds)

### CLI alternative

```bash
npm run load:demo
npm run verify:megawide-office
```

### Reset between test cycles

| Method | Action |
|--------|--------|
| UI | `/admin/demo` → **Reset Demo Database** |
| CLI | `npm run reset:demo` |

### Demo project quick reference

| Field | Value |
|-------|-------|
| Name | Megawide Office Building |
| Code | `QTX-PILOT-MEGAWIDE-001` |
| BOQ lines | 600 |
| Grand total | ~₱450M |
| Disciplines | 15 Philippine construction trades |

See [DEMO_PROJECT_DESCRIPTION.md](./DEMO_PROJECT_DESCRIPTION.md) for full dataset details.

---

## 1. Pilot Objectives

The pilot validates that Quantix V1 works reliably for real estimating workflows before wider rollout. We need feedback on:

- **Accuracy** — BOQ calculations and estimate summary totals
- **Usability** — Navigation, forms, and table editing
- **Performance** — Large projects, search, and export
- **Permissions** — Role-appropriate access
- **Stability** — Crashes, errors, and data loss

---

## 2. Getting Access

1. Your administrator will provision your account (email + temporary password).
2. Open the pilot URL provided by your admin (e.g. `https://quantix.yourcompany.com`).
3. Log in at `/login` with your credentials.
4. Change your password via Supabase if prompted by your admin.

**Roles you may be assigned:**

| Role | Typical pilot use |
|------|-------------------|
| **Estimator** | Create projects, edit WBS/BOQ, run AI Estimator, export |
| **Quantity Surveyor** | Review and export projects across team |
| **Viewer** | Read-only review of assigned projects |
| **Admin** | Company settings, resource library, benchmarks, UAT hub |

---

## 3. Recommended Test Sequence

Complete these steps in order for your first session (~60–90 minutes). Use the **Megawide Office Building** demo project (`QTX-PILOT-MEGAWIDE-001`) unless your admin directs otherwise.

### Step 0 — Load demo (Admin, 5 min)
- [ ] Admin loads demo via `/admin/demo` or `npm run load:demo`
- [ ] Run `npm run verify:megawide-office` — confirm **RESULT: PASS**
- [ ] Open Projects → **Megawide Office Building**

### Step 1 — Orientation (10 min)
- [ ] Log in and confirm your name and role appear in the header
- [ ] Open the Dashboard — confirm estimated value includes ~₱450M demo project
- [ ] Open Megawide Office Building from Projects list

### Step 2 — Review Estimate (20 min)
- [ ] WBS: confirm 20 nodes across Civil, Architectural, MEPF, External Works
- [ ] BOQ: browse 600 lines — filter by discipline (e.g. Concrete, Electrical)
- [ ] Verify total rate = sum of material + labor + equipment + subcontract + other on sample lines
- [ ] Open Estimate Summary — direct cost matches BOQ sum (~₱322M)
- [ ] Confirm OCM 10% / Contingency 5% / Profit 8% / VAT 12% → grand total ~₱450M

### Step 3 — Rate Analysis (15 min)
- [ ] Open Rates on a BOQ line (e.g. concrete or rebar item)
- [ ] Confirm resources from company library are linked
- [ ] Review rate build-up amounts vs BOQ rate columns

### Step 4 — Validation & Export (15 min)
- [ ] Open Validation panel on Summary — confirm **PASS** (no critical errors)
- [ ] Export to Excel — verify grand total matches on-screen summary
- [ ] Open print view (`Summary → Print`) and confirm layout

### Step 5 — Benchmark & AI (10 min)
- [ ] Open `/admin/benchmarks?projectId=e1a11111-1111-4111-a111-111111111101`
- [ ] Confirm historical benchmark recognizes the project
- [ ] Open AI Estimator on a structural item — confirm project context loads

### Step 6 — Role Check (10 min)
- [ ] Confirm actions match your role (e.g. Viewer cannot edit BOQ)
- [ ] If Admin: review Company Settings and Resource Library (Philippine rates seeded)

### Step 7 — Optional Advanced
- [ ] Performance: scroll/search 600-line BOQ
- [ ] Make a small edit and review Audit History
- [ ] Admin: reset and reload demo to verify one-click seed

---

## 4. Full Checklist

For comprehensive coverage, use [UAT_CHECKLIST.md](./UAT_CHECKLIST.md) (98 scenarios). Focus on modules relevant to your role:

| If you are… | Priority modules |
|-------------|------------------|
| Estimator | Projects, WBS, BOQ, Rate Analysis, Summary, AI Estimator, Export |
| QS | Projects, Summary, Validation, Export, Audit |
| Admin | Company Settings, Resource Library, Benchmarks, UAT Suite |
| Viewer | Projects (read-only), Summary, Audit |

Record each scenario as **P** (pass), **PO** (pass with observation), **F** (fail), **B** (blocked), or **NT** (not tested).

---

## 5. What Is Expected vs Not Expected

### Expected (working)
- BOQ calculations accurate to ±0.01
- Estimate summary chain: Direct → OCM → Contingency → Profit → VAT → Grand Total
- Excel export with company branding
- Project lifecycle transitions with audit logging
- Role-based edit restrictions

### Not expected (see [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md))
- Excel import of BOQ on standard projects
- Native PDF download (use browser print)
- Real-time multi-user editing
- User self-registration
- Procurement, contracts, or cash flow modules

---

## 6. Reporting Issues

### When to report
- Calculation does not match manual check
- Data lost after save or refresh
- Permission error for an action you should be able to perform
- Export fails or produces wrong totals
- Page crash or persistent error message
- Performance unacceptable (> 10 s load on normal project)

### How to report
1. Copy [ISSUE_REPORT_TEMPLATE.md](./ISSUE_REPORT_TEMPLATE.md) into your issue tracker or email.
2. Fill in all required fields.
3. Attach screenshots and exported files if relevant.
4. Include the **scenario ID** from UAT_CHECKLIST if applicable (e.g. `UAT-BOQ-004`).
5. Send to your pilot coordinator or log in [UAT_BUG_TRACKER.md](./UAT_BUG_TRACKER.md).

### Severity guide

| Severity | Examples |
|----------|----------|
| **Critical** | Data loss, wrong grand total, security bypass, cannot log in |
| **High** | Export blocked incorrectly, BOQ save fails, validation false positive |
| **Medium** | UI layout issue, slow search, missing audit entry |
| **Low** | Typo, cosmetic issue, nice-to-have |

---

## 7. Admin Tools (Admins Only)

| Route | Purpose |
|-------|---------|
| `/admin/demo` | **Load Demo Project** / **Reset Demo Database** |
| `/admin/settings` | Company branding and defaults |
| `/admin/benchmarks` | Historical estimate validation |
| `/admin/uat` | UAT checklist, formula verification, performance tests |
| `/admin/resource-library` | Rate library management |

Admins can export UAT test reports from `/admin/uat` for pilot sign-off documentation.

---

## 8. Pilot Feedback Sessions

Your pilot coordinator may schedule structured feedback sessions. Prepare:

- List of scenarios marked **F** or **PO** in your checklist
- Top 3 usability pain points
- Comparison notes vs your current estimating tool (if applicable)
- Export samples (Excel files) for total verification

---

## 9. Support Contacts

| Role | Contact |
|------|---------|
| Pilot coordinator | _[Fill before pilot]_ |
| Technical support | _[Fill before pilot]_ |
| Product owner | _[Fill before pilot]_ |

---

*End of Document*
