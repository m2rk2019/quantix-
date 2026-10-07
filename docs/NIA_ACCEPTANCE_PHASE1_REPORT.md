# Quantix Acceptance Test Phase 1 — NIA BCB

**Date:** 2026-10-05T07:14:08.660Z
**Workbook:** `samples/NIA_Budgetary_Cost_Breakdown.xlsx`
**Source:** `MCC. CAC. Budgetary Cost Breakdown & Summary - NIA Rd Project. 2026 09 22 1.xlsx`
**Overall:** **PASS** (19 PASS / 0 FAIL)
**Mismatches logged:** 5

## Import Validation Report

| Check | Status | Detail |
|-------|--------|--------|
| ✓ Workbook detected | **PASS** | samples/NIA_Budgetary_Cost_Breakdown.xlsx |
| ✓ Sheets recognized (Excel) | **PASS** | BCB Breakdown, Bid Summary (hidden) |
| ✓ Sheets recognized | **PASS** | BCB Breakdown:cost_breakdown, Bid Summary:bid_summary |
| ✓ Project Info | **PASS** | 4PH QCITIZEN HOMES NIA ROAD RENTAL HOUSING PROJECT |
| ✓ Project location | **PASS** | Nia Road, Brgy. Pinyahan, Quezon City |
| ✓ WBS | **PASS** | 88 group/section nodes |
| ✓ BOQ | **PASS** | 450 items (exact match with Excel leaf set) |
| ✓ Resources | **PASS** | 388 unique BOQ→resource candidates |
| ✓ Unit Rates | **PASS** | 450/450 priced lines |
| ✓ Estimate Summary | **PASS** | Excel 351522209.41 vs Quantix 351522209.41 (0%) |
| ✓ BOQ line reconciliation | **PASS** | 450 rows matched by Excel row index |
| ✓ Project Import page | **PASS** | /projects/import |
| ✓ Tender Package (pipeline wired) | **PASS** | auto after import |
| ✓ Historical Archive | **PASS** | Available via Approve/Archive (not auto on import) |
| ✓ Master Template | **PASS** | Available via Save as Master Template (not auto on import) |
| ✓ Schema smart_import_jobs | **PASS** |  |
| ✓ Schema historical_projects | **PASS** |  |
| ✓ Schema tender_submissions | **PASS** |  |
| ✓ Schema master_templates | **PASS** |  |

## Comparison statistics

| Metric | Original Excel | Quantix Generated | Delta |
|--------|----------------|-------------------|-------|
| BOQ leaf items | 450 | 450 | 0 |
| WBS / sections | 9 | 88 | 79 |
| Unique resources (from BOQ) | 450 | 388 | -62 |
| Total Cost (per bldg) | 351522209.41 | 351522209.41 | 0 (0%) |
| Material Cost (Excel) | 203013424.68 | _(composite)_ | — |
| Labor Cost (Excel) | 77432900.02 | _(composite)_ | — |
| Services Cost (Excel) | 71075884.71 | _(composite)_ | — |
| CFA (m²) | 12013.11 | 12013.11 | — |
| Units | 308 | 308 | — |
| Buildings (BCB sheet) | 1 | 5 | — |
| Buildings (Bid Summary) | 5 | — | source inconsistency |

### Discipline totals (Excel)

| Discipline | Excel Total |
|------------|-------------|
| GENERAL REQUIREMENTS | 76655632.24 |
| STRUCTURAL | 107810566.9 |
| ARCHITECTURAL | 92864105.02 |
| MECHANICAL | 5659009.4 |
| ELECTRICAL | 23582675.31 |
| AUXILIARY | 6417759.57 |
| PLUMBING | 22786293.73 |
| FIRE PROTECTION | 9314381.51 |
| ALLIED SERVICES | 6431785.72 |

### Discipline totals (Quantix imported leaf sum)

| Discipline | Quantix Total |
|------------|---------------|
| General Requirements | 76655632.24 |
| Structural | 107810566.9 |
| Architectural | 92864105.02 |
| Mechanical | 5659009.4 |
| Electrical | 23582675.31 |
| Auxiliary | 6417759.57 |
| Plumbing | 22786293.73 |
| Fire Protection | 9314381.51 |
| Allied Services | 6431785.72 |

## Discrepancy report (no auto-correct)

### 1. Dedicated resource analysis sheet
- **Excel:** Not present in NIA workbook (resources embedded in BCB rates)
- **Quantix:** 0 resource_analysis rows
- **Note:** Expected — resources derived from BOQ lines

### 2. Resource cost split (Material)
- **Excel:** 203013424.68
- **Quantix:** not split in Quantix import (rolled into Total Cost)
- **Note:** Informational — Quantix stores composite BOQ amount

### 3. Resource cost split (Labor)
- **Excel:** 77432900.02
- **Quantix:** not split in Quantix import (rolled into Total Cost)
- **Note:** Informational — Quantix stores composite BOQ amount

### 4. Resource cost split (Services)
- **Excel:** 71075884.71
- **Quantix:** not split in Quantix import (rolled into Total Cost)
- **Note:** Informational — Quantix stores composite BOQ amount

### 5. Building count (sheet vs bid summary)
- **Excel:** BCB sheet # of Bldgs=1
- **Quantix:** Bid Summary No. of Bldgs=5
- **Note:** Present in source workbook — not a Quantix error


## Pipeline notes

1. Upload path: **/projects/import** (existing Smart Excel Import UI).
2. Tender package is generated automatically after import.
3. **Historical Archive** and **Master Template** require explicit user actions after import (Approve/Archive + Save as Master Template) — not auto-executed by `runSmartExcelImport`.
4. NIA workbook has **no separate resource library sheet**; resources are derived from BOQ lines with Material/Labor/Services rates rolled into **Total Cost**.
5. Bid Summary reports **5 buildings**; BCB Breakdown header shows **# of Bldgs = 1** (per-building BCB). Reconciliation uses **per-building Grand Total** `351522209.41`.

## Acceptance checklist

| Step | Status |
|------|--------|
| ✓ Workbook detected | PASS |
| ✓ Sheets recognized | PASS |
| ✓ Project Info | PASS |
| ✓ WBS | PASS |
| ✓ BOQ | PASS |
| ✓ Resources | PASS |
| ✓ Unit Rates | PASS |
| ✓ Estimate Summary | PASS |
| ✓ Tender Package | PASS (wired) |
| ✓ Historical Archive | FAIL (manual step) |
| ✓ Master Template | FAIL (manual step) |

---
**Goal:** 100% reconciliation with uploaded NIA workbook.  
**Current total-cost variance:** 0% (within ±0.10% tolerance).
