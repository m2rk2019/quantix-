# User Acceptance Testing Checklist — Quantix V1

| Field | Value |
|-------|-------|
| **Document** | UAT_CHECKLIST |
| **Sprint** | 15A — Comprehensive UAT Suite |
| **Product** | Quantix V1 |
| **Related** | [UAT_RESULTS.md](./UAT_RESULTS.md) · [UAT_PLAN.md](./UAT_PLAN.md) · [UAT_BUG_TRACKER.md](./UAT_BUG_TRACKER.md) |

**Instructions:** Execute scenarios in order within each module where dependencies exist. Record **Result** as P / PO / F / B / NT. Log failures in [UAT_BUG_TRACKER.md](./UAT_BUG_TRACKER.md). Automated scenarios link to `npm run` verify scripts — run `npm run verify:uat-suite` for the full automated gate.

**Admin UAT hub:** `/admin/uat` (Formula Verification, Performance Tests, Test Reports)

**Tester:** _______________ **Date:** _______________ **Environment:** _______________ **Build:** _______________

---

## Legend

| Result | Meaning |
|--------|---------|
| P | Pass |
| PO | Pass with observation |
| F | Fail |
| B | Blocked |
| NT | Not tested |

---

## 1. Authentication

| ID | Scenario | Steps | Expected results | Auto | Result | Notes |
|----|----------|-------|------------------|------|--------|-------|
| UAT-LOGIN-001 | Successful login | Open `/login`. Enter valid credentials. Submit. | Redirect to `/dashboard`. Session persists. | | | |
| UAT-LOGIN-002 | Invalid credentials | Enter wrong password. Submit. | Error shown. User remains on login page. | | | |
| UAT-LOGIN-003 | Protected route redirect | Log out. Navigate to `/projects`. | Redirect to `/login`. | | | |
| UAT-LOGIN-004 | Logout | Open user menu. Log out. | Session cleared. `/dashboard` requires login. | | | |
| UAT-LOGIN-005 | Inactive account | Attempt login with deactivated user. | Login denied with appropriate error. | | | |
| UAT-LOGIN-006 | Session persistence | Login. Refresh browser. | User remains authenticated. | | | |

---

## 2. Company Settings

| ID | Scenario | Steps | Expected results | Auto | Result | Notes |
|----|----------|-------|------------------|------|--------|-------|
| UAT-SET-001 | Admin access | Login as Admin. Open `/admin/settings`. | Settings page loads. Non-admin redirected. | `verify:company-settings` | | |
| UAT-SET-002 | Company profile | Edit company name, address, phone. Save. | Changes persist after refresh. | | | |
| UAT-SET-003 | Default percentages | Set default OCM, contingency, profit, VAT. Save. | Defaults saved for new projects. | | | |
| UAT-SET-004 | Branding theme | Change theme color. Save. | Theme applied to exports and dashboard. | | | |
| UAT-SET-005 | Report header/footer | Edit report header and footer. Save. | Text appears on Excel exports. | | | |
| UAT-SET-006 | Viewer blocked | Login as Viewer. Navigate to `/admin/settings`. | Redirect to `/unauthorized`. | | | |

---

## 3. Projects

| ID | Scenario | Steps | Expected results | Auto | Result | Notes |
|----|----------|-------|------------------|------|--------|-------|
| UAT-PROJ-001 | List display | Open `/projects`. | Table shows accessible projects. | | | |
| UAT-PROJ-002 | Search | Enter partial project name or code. | List filters to matching projects. | | | |
| UAT-PROJ-003 | Status filter | Filter by status. | Only matching projects shown. | | | |
| UAT-PROJ-004 | Create project | Login as Estimator. Create project. | Project created with `QTX-YYYY-######` code. | `verify:create-project` | | |
| UAT-PROJ-005 | Permissions matrix | For each role, attempt create/edit/delete. | Outcomes match authorization matrix. | `verify:projects` | | |
| UAT-PROJ-006 | Lifecycle transitions | Draft → In Progress → For Review → Approved. | Status changes with audit events. | | | |
| UAT-PROJ-007 | Estimate settings | Edit percentages on project details. Save. | Summary recalculates. | | | |
| UAT-PROJ-008 | Soft delete | Delete Draft project. | Project removed from list. | | | |

---

## 4. WBS

| ID | Scenario | Steps | Expected results | Auto | Result | Notes |
|----|----------|-------|------------------|------|--------|-------|
| UAT-WBS-001 | Tree display | Open WBS tab. | Hierarchical tree with codes and descriptions. | | | |
| UAT-WBS-002 | Add root node | Add WBS node at root. | Node appears in tree. | | | |
| UAT-WBS-003 | Add child node | Select parent. Add child. | Child nested under parent. | | | |
| UAT-WBS-004 | Edit node | Edit description. Save. | Changes persist. Audit logged. | | | |
| UAT-WBS-005 | Delete node | Delete leaf node. | Leaf deletes when allowed. | | | |
| UAT-WBS-006 | Search | Search by code or description. | Tree filters or highlights matches. | | | |
| UAT-WBS-007 | Viewer read-only | Login as Viewer. Open WBS. | No add/edit/delete controls. | | | |
| UAT-WBS-008 | Large tree | Open project with 100+ WBS nodes. | Tree remains responsive. | | | |

---

## 5. BOQ

| ID | Scenario | Steps | Expected results | Auto | Result | Notes |
|----|----------|-------|------------------|------|--------|-------|
| UAT-BOQ-001 | Grid display | Open BOQ tab. | All rate columns, total rate, total amount visible. | | | |
| UAT-BOQ-002 | Add line item | Add BOQ row with qty and rates. | Total rate = sum of five rates. Amount = qty × rate. | `verify:estimating-engine` | | |
| UAT-BOQ-003 | Inline edit | Change quantity. Save. | Total amount recalculates immediately. | | | |
| UAT-BOQ-004 | Rate calculation | Set material=100, labor=50, equipment=25, subcontract=10, other=5. | Total rate = 190.00. Qty 10 → 1,900.00. | | | |
| UAT-BOQ-005 | WBS filter | Filter BOQ by WBS node. | Only matching items shown. | | | |
| UAT-BOQ-006 | Search | Search by item code or description. | Matching rows displayed. | | | |
| UAT-BOQ-007 | Pagination | Scroll project with 200+ lines. | Additional pages load without duplicates. | | | |
| UAT-BOQ-008 | Delete item | Delete a BOQ line. | Row removed. Direct cost decreases. | | | |
| UAT-BOQ-009 | Viewer read-only | Login as Viewer. Open BOQ. | No inline edit, add, or delete. | | | |
| UAT-BOQ-010 | Large BOQ benchmark | Open project with 1000+ BOQ lines. | Grid loads within performance threshold. | | | |

---

## 6. Rate Library

| ID | Scenario | Steps | Expected results | Auto | Result | Notes |
|----|----------|-------|------------------|------|--------|-------|
| UAT-RL-001 | Browse materials | Open `/admin/resource-library/materials`. | Materials list with code, description, unit, rate. | | | |
| UAT-RL-002 | Add material | Login as Admin. Add new material. | Resource saved and searchable. | | | |
| UAT-RL-003 | Edit labor rate | Update labor resource rate. Save. | Rate updated. Audit logged. | | | |
| UAT-RL-004 | Equipment catalog | Open equipment tab. | Equipment resources listed. | | | |
| UAT-RL-005 | Subcontract catalog | Open subcontract tab. | Subcontract resources listed. | | | |
| UAT-RL-006 | Viewer browse only | Login as Viewer. Browse library. | Read-only. No create/edit/delete. | | | |
| UAT-RL-007 | Export library | Export resource library to Excel. | Workbook downloads with all categories. | | | |

---

## 7. Rate Analysis

| ID | Scenario | Steps | Expected results | Auto | Result | Notes |
|----|----------|-------|------------------|------|--------|-------|
| UAT-RA-001 | Open rate analysis | Open Rates tab on BOQ item. | Rate analysis panel with resource lines. | | | |
| UAT-RA-002 | Add resource line | Add material from library. | Line amount = qty × consumption × rate. | | | |
| UAT-RA-003 | Category totals | Review material/labor/equipment totals. | Totals match BOQ rate columns. | `verify:rate-analysis` | | |
| UAT-RA-004 | Library sync | Update library rate. Sync BOQ item. | BOQ rates update from analysis lines. | | | |
| UAT-RA-005 | Manual override | Override material rate on BOQ. | Override flag set. Analysis preserved. | | | |
| UAT-RA-006 | Duplicate detection | Add duplicate resource on same line. | Validation warning or block. | | | |

---

## 8. Estimate Summary

| ID | Scenario | Steps | Expected results | Auto | Result | Notes |
|----|----------|-------|------------------|------|--------|-------|
| UAT-SUM-001 | Summary display | Open Estimate Summary tab. | Direct, OCM, Contingency, Profit, VAT, Grand Total shown. | | | |
| UAT-SUM-002 | Direct cost accuracy | Compare direct cost to BOQ sum. | Direct cost equals sum of BOQ total_amount. | | | |
| UAT-SUM-003 | Overhead chain | Set known percentages. Refresh summary. | OCM, contingency, profit, VAT chain correct. | | | |
| UAT-SUM-004 | WBS rollup | Review WBS rollup panel. | Hierarchy matches WBS tab totals. | | | |
| UAT-SUM-005 | Refresh | Change BOQ. Click Refresh. | Totals update to reflect changes. | | | |
| UAT-SUM-006 | Approved read-only | Open Approved project. | Summary displays. Edit disabled elsewhere. | | | |

---

## 9. AI Estimator

| ID | Scenario | Steps | Expected results | Auto | Result | Notes |
|----|----------|-------|------------------|------|--------|-------|
| UAT-AI-001 | Page access | Login as Estimator. Open AI Estimator tab. | Copilot panel loads. | `verify:ai-engineering` | | |
| UAT-AI-002 | Quantity suggestion | Request concrete volume for slab. | Formula-based quantity returned with explanation. | | | |
| UAT-AI-003 | Apply to BOQ | Accept suggested quantity on BOQ line. | Quantity updated on BOQ item. | | | |
| UAT-AI-004 | Viewer blocked | Login as Viewer. Open AI Estimator. | Access denied or read-only per policy. | | | |
| UAT-AI-005 | Engineering modules | Browse available engineering modules. | 10 modules listed with quantity types. | | | |

---

## 10. Executive Dashboard

| ID | Scenario | Steps | Expected results | Auto | Result | Notes |
|----|----------|-------|------------------|------|--------|-------|
| UAT-EXEC-001 | Dashboard load | Login as Admin. Open `/dashboard`. | KPI cards and charts load. | `verify:executive-dashboard` | | |
| UAT-EXEC-002 | Project status buckets | Review status distribution. | Six status buckets displayed correctly. | | | |
| UAT-EXEC-003 | Cost breakdown | Review cost category chart. | Eight categories with totals. | | | |
| UAT-EXEC-004 | Executive export | Export executive report to Excel. | Workbook downloads with KPI sheets. | | | |
| UAT-EXEC-005 | Print view | Open `/dashboard/print`. | Print-optimized layout renders. | | | |

---

## 11. Historical Benchmark

| ID | Scenario | Steps | Expected results | Auto | Result | Notes |
|----|----------|-------|------------------|------|--------|-------|
| UAT-BENCH-001 | Benchmark hub | Open `/admin/benchmarks`. | Accuracy dashboard loads. | `verify:historical-benchmarks` | | |
| UAT-BENCH-002 | Validation center | Select benchmark project. View validation. | Estimated vs actual comparison with variance. | | | |
| UAT-BENCH-003 | Formula audit | Open Formula Audit tab. | Per-item formula breakdown with drill-down. | | | |
| UAT-BENCH-004 | Data import | Import CSV benchmark bundle. | Project, WBS, BOQ, actuals created. | | | |
| UAT-BENCH-005 | Acceptance criteria | Review accuracy dashboard. | ≥95% qty/rate, ≥97% formula, 100% consistency. | | | |
| UAT-BENCH-006 | Benchmark reports | Export validation and lessons learned reports. | Excel reports download. | | | |

---

## 12. Excel Export

| ID | Scenario | Steps | Expected results | Auto | Result | Notes |
|----|----------|-------|------------------|------|--------|-------|
| UAT-EXP-001 | Permission gate | Login as Viewer. Open Summary. | Export button hidden. | | | |
| UAT-EXP-002 | Validation gate | Leave validation errors. Attempt export. | Export disabled with reason. | | | |
| UAT-EXP-003 | Successful export | Fix validation. Export to Excel. | `.xlsx` downloads with all sheets. | | | |
| UAT-EXP-004 | Summary sheet totals | Compare Sheet 2 to on-screen summary. | Direct, OCM, VAT, Grand Total match. | | | |
| UAT-EXP-005 | BOQ sheet data | Compare Sheet 4 to BOQ grid. | All columns and rows match. | | | |
| UAT-EXP-006 | Large project export | Export 1000+ line project. | Export completes within threshold. | | | |
| UAT-EXP-007 | Audit on export | Check audit after export. | `project.exported` event logged. | | | |

---

## 13. PDF Export (Print)

| ID | Scenario | Steps | Expected results | Auto | Result | Notes |
|----|----------|-------|------------------|------|--------|-------|
| UAT-PDF-001 | Estimate print view | Open `/projects/[id]/summary/print`. | Print-optimized estimate summary renders. | | | |
| UAT-PDF-002 | Auto-print | Open print URL with `?autoprint=1`. | Browser print dialog opens. | | | |
| UAT-PDF-003 | Print totals match | Compare print view to summary tab. | All totals and percentages match. | | | |
| UAT-PDF-004 | Executive print | Open `/dashboard/print`. | Executive KPI print layout renders. | | | |
| UAT-PDF-005 | Company branding | Print with custom company settings. | Company name and header appear on print. | | | |

---

## 14. Validation

| ID | Scenario | Steps | Expected results | Auto | Result | Notes |
|----|----------|-------|------------------|------|--------|-------|
| UAT-VAL-001 | Panel display | Open Validation on Summary or `/validation`. | Score and categorized checks visible. | | | |
| UAT-VAL-002 | All checks pass | Use complete UAT project. | All 12 checks pass. | | | |
| UAT-VAL-003 | Export gate | With errors present, check Export. | Export disabled with tooltip reason. | | | |
| UAT-VAL-004 | Go-to links | Click Go to on failing check. | Navigates to correct module. | | | |

---

## 15. Audit Trail

| ID | Scenario | Steps | Expected results | Auto | Result | Notes |
|----|----------|-------|------------------|------|--------|-------|
| UAT-AUD-001 | Page access | Open Audit History tab. | Chronological event list. | | | |
| UAT-AUD-002 | BOQ change logged | Edit BOQ. Check audit. | BOQ update event recorded. | | | |
| UAT-AUD-003 | Lifecycle event | Approve project. Check audit. | Status transition logged. | | | |
| UAT-AUD-004 | Append-only | Confirm no delete on audit entries. | Audit log is read-only. | | | |

---

## 16. Cross-Cutting

| ID | Scenario | Steps | Expected results | Auto | Result | Notes |
|----|----------|-------|------------------|------|--------|-------|
| UAT-X-001 | Role matrix smoke | For each role, test create/edit/export/approve. | Matches authorization matrix. | | | |
| UAT-X-002 | Responsive tablet | Set viewport 768px. Navigate app. | Layout usable with horizontal scroll on tables. | | | |
| UAT-X-003 | End-to-end happy path | Create → WBS → BOQ → Summary → Validate → Export. | Complete workflow without errors. | | | |
| UAT-X-004 | Formula verification | Run UAT Formula Verification at `/admin/uat`. | 100% pass on demo project. | `verify:estimating-engine` | | |
| UAT-X-005 | Performance suite | Run UAT Performance Tests at `/admin/uat`. | All metrics under threshold. | `verify:uat-suite` | | |

---

## Summary Scorecard

| Module | Scenarios | Pass | PO | Fail | Blocked | NT | % Pass |
|--------|-----------|------|----|------|---------|-----|--------|
| Authentication | 6 | | | | | | |
| Company Settings | 6 | | | | | | |
| Projects | 8 | | | | | | |
| WBS | 8 | | | | | | |
| BOQ | 10 | | | | | | |
| Rate Library | 7 | | | | | | |
| Rate Analysis | 6 | | | | | | |
| Estimate Summary | 6 | | | | | | |
| AI Estimator | 5 | | | | | | |
| Executive Dashboard | 5 | | | | | | |
| Historical Benchmark | 6 | | | | | | |
| Excel Export | 7 | | | | | | |
| PDF Export | 5 | | | | | | |
| Validation | 4 | | | | | | |
| Audit Trail | 4 | | | | | | |
| Cross-Cutting | 5 | | | | | | |
| **TOTAL** | **98** | | | | | | |

**UAT lead signature:** _______________ **Date:** _______________

---

*End of Document*
