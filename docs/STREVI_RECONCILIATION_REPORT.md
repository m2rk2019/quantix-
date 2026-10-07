# STREVI BOQ Reconciliation Report

**Status:** Investigation complete — no importer code changed.  
**Workbook:** `EPC. CAC. BID. 4PH STREVI. BCB Breakdown & Summary (4 Bldgs). 2026 05 18 2.xlsx`  
**Sheet / cell:** BCB Breakdown `P13` = `P669` GRAND TOTAL (VAT Ex) / Direct Cost  
**Project:** QTX-2026-000017

## Totals

| Source | Amount (PHP) |
| --- | ---: |
| Excel GRAND TOTAL (VAT Ex) `P13`/`P669` | **1,859,023,517.47** |
| Imported leaf sum (extract, raw) | 1,856,005,617.838… |
| Quantix Overview / `estimate_summary.direct_cost` | **1,856,005,617.83** |
| **Difference (Excel − Quantix)** | **3,017,899.64** |

Per-line 2-decimal rounding explains only **₱0.01** vs the raw leaf sum. It does **not** explain the ~₱3.02M gap.

## Discipline reconciliation

| Discipline | Excel section total | Imported leaf sum | Difference (Excel − Import) |
| --- | ---: | ---: | ---: |
| GENERAL REQUIREMENTS | 277,330,511.33 | 271,693,312.29 | **+5,637,199.03** (under-import) |
| STRUCTURAL | 729,568,011.98 | 729,568,011.98 | ~0 |
| ARCHITECTURAL | 437,235,580.54 | 437,235,580.54 | ~0 |
| MECHANICAL | 47,614,312.34 | 47,614,312.34 | ~0 |
| ELECTRICAL | 142,076,860.84 | 144,696,160.24 | **−2,619,299.40** (over-import) |
| AUXILIARY | 36,912,328.95 | 36,912,328.95 | 0 |
| PLUMBING | 118,641,798.51 | 118,641,798.51 | ~0 |
| FIRE PROTECTION | 49,515,541.56 | 49,515,541.56 | ~0 |
| ALLIED SERVICES | 20,128,571.43 | 20,128,571.43 | ~0 |
| **Net** | **1,859,023,517.47** | **1,856,005,617.84** | **+3,017,899.63** |

## Exact rows responsible

### 1) Missing — false rollup skip (General Requirements)

| Excel row | Description | Excel amount | Import status |
| ---: | --- | ---: | --- |
| **37** | Maintenance Crew | **5,637,199.03** | Classified as `is_group_header`; amount zeroed / not in leaf BOQ |

- Outline: `ol=2` leaf under Support Crew; next row 38 Utilities is `ol=1` (sibling of parent), unit `mos`.
- Sibling House Keeping (row 36, same pattern `lot`/`1`) **was imported correctly**.
- Cause: `isBoqRollupParent` lot heuristic treats “next non-lot unit” as proof of children even when outline says the next row is **not** a child (`nextLevel <= level`).

**Impact: −₱5,637,199.03**

### 2) Missing — false rollup skip (Electrical)

| Excel row | Description | Excel amount | Import status |
| ---: | --- | ---: | --- |
| **377** | Security Grills (Meter Center & Busduct) | **6,000,000.00** | Classified as `is_group_header` |

- Outline: `ol=2` peer of Meter Center leaves; next row 378 C-Rated kWh meter is same outline, same description column (sibling), different amount.
- Cause: same lot-next-nonlot false positive (sibling `set/s` mistaken for measurable child).

**Impact: −₱6,000,000.00**

### 3) Duplicated — assembly package + component lines (Electrical Meter Center)

Excel Meter Center (row 372) total **14,643,299.40** = MC2 **8,619,299.40** + Security Grills **6,000,000** + C-Rated meter **24,000**.

| Excel row | Description | Amount | Import status |
| ---: | --- | ---: | --- |
| **373** | MC2 Typ to MC-3F TO MC-16F (col D package) | 8,619,299.40 | **Imported as leaf** |
| **374** | MAIN: 100AT… (col E component) | 6,579,299.40 | **Imported as leaf** |
| **376** | KW-hr Meter Base (installation only) (col E) | 2,040,000.00 | **Imported as leaf** |
| 377 | Security Grills | 6,000,000.00 | Missing (above) |
| 378 | C-Rated kilowatt-hour meter | 24,000.00 | Imported OK |

Rows 374 + 376 = **8,619,299.40** = row 373. Package and components are both kept because amounts are unequal, so `shouldSkipDuplicateSibling` (equal-amount lot/detail dedupe) does not fire. Unit is `set/s` qty 60, so the lot rollup path also does not apply.

Imported Meter Center contribution: 8,619,299.40 + 6,579,299.40 + 2,040,000 + 24,000 = **17,262,598.80**  
Excel Meter Center: **14,643,299.40**  
**Net Electrical overage: +₱2,619,299.40** (= +8,619,299.40 double-count − 6,000,000 missed Security Grills)

### Net of culprit rows

| Effect | Amount |
| --- | ---: |
| Miss Maintenance Crew (37) | −5,637,199.03 |
| Miss Security Grills (377) | −6,000,000.00 |
| Double-count MC2 components (374+376 with 373 kept) | +8,619,299.40 |
| **Net (matches Excel − Import)** | **−3,017,899.63** |

## Checks (task 4)

| Check | Result |
| --- | --- |
| Parent rollups skipped | Mostly correct for outline parents and equal-amount lot→col-E detail (e.g. Busway 324→325). |
| Zero-cost placeholders skipped | Yes; not a cause of this gap (e.g. Elevator-02 provision = 0). |
| Formulas evaluated differently | No; cached Excel values used; discipline banners sum to `P13`. |
| Rounding accumulated | Only ~₱0.01 vs leaf sum; not the ₱3.02M gap. |
| Assemblies expanded incorrectly | **Yes** — MC2 package + partial col-E components both imported. |

No other discipline contributes material variance. Convenience-outlet same-priced siblings are genuine separate lines, not doubles.

## Root cause (code)

File: `lib/smart-import/extractors.ts`

1. **`isBoqRollupParent` lot branch** — after outlining finds no deeper child, still returns `true` when the next row with a unit is non-`lot`, without requiring that row to be an indented child (`outlineLevel > current` **or** description column further right). That falsely skips true leaves **37** and **377**.

2. **Assembly / column-indent expansion** — equal-amount dedupe in `shouldSkipDuplicateSibling` does not cover package rows whose col-E follow-ons **sum** to the package total (MC2). Package **373** and components **374/376** are all imported.

## Proposed minimal fix (do not apply until approved)

**A. Gate the lot-next-nonlot rollup (fixes rows 37 & 377)** in `isBoqRollupParent`:

When outline levels are present, only treat a following non-lot row as evidence of children if:

- `nextLevel > level`, **or**
- `nextLevel === level` **and** `nextResolved.column > descColumn` (indented further right).

If `nextLevel < level`, stop and return `false` (sibling of parent — not a child).

This preserves Busway/Mechanical lot→detail skips (same outline, col E) and restores Maintenance Crew / Security Grills.

**B. Treat col-D package with col-E partials as rollup (fixes MC2)** — either:

- In `isBoqRollupParent` / leaf path: if the next same-outline row has description further right, classify current as rollup parent even when unit ≠ `lot`; **or**
- After equal-amount dedupe: if immediately following further-right description rows’ amounts sum to the package amount (±0.02), drop the package and keep the components (prefer measurable detail).

Prefer keeping components (374, 376) and skipping package 373 so Security Grills remains a peer leaf once (A) is fixed.

**Verification after fix (re-import STREVI):**

- Gen Req leaf sum = Excel 277,330,511.33  
- Electrical leaf sum = Excel 142,076,860.84  
- Overview Grand Total = Excel **₱1,859,023,517.47**

Machine-readable copy: `docs/STREVI_RECONCILIATION_REPORT.json`
