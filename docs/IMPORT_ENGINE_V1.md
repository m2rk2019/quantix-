# Quantix Import Engine v1.0 — Production Standard

**Status:** FROZEN / ACCEPTED  
**Version:** `1.0.0`  
**Label:** Quantix Import Engine v1.0  
**Freeze date:** 2026-10-05  

Do **not** modify importer behavior unless a production bug is discovered.  
Any future change **must** pass automatic regression against **both** NIA and STREVI.

```bash
npm run regression:import-engine-v1
```

Version marker: `lib/smart-import/engine-version.ts`  
Goldens: `docs/import-engine-v1/REGRESSION_GOLDENS.json`

---

## 1. Supported workbook patterns

### 1.1 NIA (accepted)

| Field | Value |
| --- | --- |
| Sample | `samples/NIA_Budgetary_Cost_Breakdown.xlsx` |
| Source family | MCC/NIA Budgetary Cost Breakdown |
| Leaf BOQ count (v1.0) | **450** |
| Direct-cost leaf sum (extract, 2dp) | **₱351,522,209.41** |
| WBS levels | 1 (discipline), 2 (package/group) |

### 1.2 STREVI (accepted)

| Field | Value |
| --- | --- |
| Sample | `samples/STREVI_BCB_Breakdown.xlsx` |
| Source family | EPC/CAC BID BCB Breakdown & Summary |
| Leaf BOQ count (v1.0) | **505** |
| Direct-cost / GRAND TOTAL (VAT Ex) | **₱1,859,023,517.47** |
| WBS levels | 1 (discipline), 2 (package/group) |

Both patterns are content-classified MCC-style BCB sheets (not worksheet-name dependent). Overview Grand Total in Quantix displays **direct cost** (Excel VAT Ex / Direct Cost), not bid price with markups.

---

## 2. Parsing rules (permanent production standard)

Implementation: `lib/smart-import/extractors.ts`, `sheet-classifier.ts`, `build-wbs-from-boq.ts`, `link-boq-resources.ts`, `validate-and-match.ts`.

### 2.1 Package rows

- Section codes matching `N.0` (e.g. `1.0`, `5.0`) set the active **discipline** and become group headers (not priced leaves).
- Column-indent hierarchy (NIA/MCC/STREVI):  
  **B** section → **C** package → **D** sub-package / ITEM → **E** detail.
- Description resolution scans the mapped ITEM column, then left (packages), then right (details).

### 2.2 Outline rows

- Excel `outlineLevel` is captured per matrix row.
- A row with a **deeper** following outline row that has description/unit is a **rollup parent** (any unit).
- Outline siblings / lower-level rows are **not** children.

### 2.3 Rollup rules (`isBoqRollupParent`)

1. **Outline children** → parent (skip as leaf; keep as group header).
2. **Assembly sum** → same-outline follow-ons with description **further right** whose amounts **sum** to the package (±₱0.02) → parent (e.g. STREVI MC2 + MAIN/KW-hr components). Keep components; skip package leaf.
3. **Lot package heuristic** (`unit = lot`, `qty = 1`) → scan following rows:
   - Non-lot next row is evidence of children **only if**:
     - outline deeper, **or**
     - same outline **and** description column further right.
   - Lower outline (uncle/sibling of parent) or same-column sibling → **do not** roll up (protects STREVI Maintenance Crew / Security Grills).
4. Equal-amount lot/detail or `MAIN:` assembly pairs are collapsed via `shouldSkipDuplicateSibling` (keep measurable detail).

### 2.4 Zero-cost placeholders

- Skip rows with `amount === 0` and `unit_rate === 0` (e.g. “By Tenant”, provision qty 0).
- Empty description rows are skipped.

### 2.5 Summary detection

- Skip `GRAND TOTAL` banners (top/footer VAT Ex).
- Commercial section titles (`Contingency`, `VAT`, `Bid Price`, mark-up, etc.) end the **direct-cost** BOQ region (`pastDirectCost`).
- Discipline banners (`1.0 GENERAL REQUIREMENTS`, …) are headers, not leaves.
- Excel GRAND TOTAL (VAT Ex) must equal the **sum of priced leaf amounts** after rollup rules (STREVI acceptance gate).

### 2.6 WBS generation (`buildWbsFromBoq`)

- Level **1**: discipline roots (1-based; satisfies `wbs_level_check`).
- Level **2**: group headers / packages under discipline.
- Leaf BOQ attaches to nearest group, else discipline.

### 2.7 BOQ generation

- Only non-header rows with unit/quantity/amount become leaves.
- `Total Cost` is authoritative; unit rate derived as `amount / quantity` when needed.
- Leaf discipline follows the active BCB section (not keyword re-detection per line).

### 2.8 Resource generation

- Prefer explicit resource-analysis sheets when present.
- Otherwise derive project rate-library resources from BOQ lines (`planBoqResourceLinks`).
- Match to company library by description score when possible.

### 2.9 Rate generation

- Each leaf gets `total_rate` / `total_amount` from Excel totals.
- Optional `boq_rate_analysis_lines` link leaf → project library item (consumption 1 for composite lines).
- Estimate Summary markups apply **after** import from `project_details` percentages; Overview Grand Total = **direct cost**.

---

## 3. Regression policy (no regression allowed)

| Gate | Requirement |
| --- | --- |
| NIA | `PASS` — leaf count, fingerprint, WBS levels unchanged |
| STREVI | `PASS` — leaf count 505, sum = Excel VAT Ex, key rows present/absent as goldens |
| Change control | Importer code under `lib/smart-import/**` and `services/smart-import/**` frozen unless production bug |
| Mandatory command | `npm run regression:import-engine-v1` before merge of any importer change |

Cursor rule: `.cursor/rules/import-engine-v1-freeze.mdc`

---

## 4. Acceptance record (v1.0 freeze)

| Workbook | Result |
| --- | --- |
| NIA | **PASS** |
| STREVI | **PASS** |

See also:

- `docs/STREVI_RECONCILIATION_REPORT.md`
- `docs/STREVI_FIX_BEFORE_AFTER_REPORT.md`
- `docs/STREVI_BOQ_COUNT_505_VERIFICATION.md`
- `docs/NIA_ACCEPTANCE_PHASE1_REPORT.md`
