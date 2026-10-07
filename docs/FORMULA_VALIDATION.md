# Formula Validation — Quantix V1 (Sprint 8)

| Field | Value |
|-------|-------|
| **Document** | FORMULA_VALIDATION |
| **Product** | Quantix |
| **Version** | 1.0 |
| **Status** | Active |
| **Related** | [COST_STRUCTURE_V1.md](./COST_STRUCTURE_V1.md) · [DEMO_PROJECT.md](./DEMO_PROJECT.md) |

---

## 1. Purpose

Sprint 8 provides an **automated formula validation suite** and a **deterministic demo estimating project** that exercises the full Quantix V1 pipeline:

Resource Library → Rate Analysis → BOQ → WBS Rollup → Estimate Summary → Bid Summary

This sprint adds **testing and verification assets only**. No production application features were changed.

---

## 2. Demo Project

| Field | Value |
|-------|-------|
| **Project Name** | Quantix Formula Validation Project |
| **Project Code** | `QTX-FORMULA-VAL-001` |
| **Project ID** | `f8a11111-1111-4111-a111-111111111101` |
| **Client** | Megawide Construction Corporation |
| **Location** | Quezon City |
| **Currency** | USD (Philippine-rate magnitudes) |
| **BOQ Items** | 100 |
| **WBS Nodes** | 14 (3 discipline groups + 11 trade packages) |

### WBS Structure

```
1  Structural
   1.1  Earthworks
   1.2  Concrete Works
   1.3  Rebar Works
2  Architectural
   2.1  Masonry
   2.2  Plastering
   2.3  Painting
   2.4  Ceiling
   2.5  Flooring
3  MEPF
   3.1  Plumbing
   3.2  Electrical
   3.3  Fire Protection
```

Each BOQ line includes material, labor, equipment, and (where applicable) subcontract components built from **rate analysis lines** linked to Philippine construction resources.

---

## 3. Formula Definitions

### 3.1 BOQ Line Rate

```
Total Rate = Material + Labor + Equipment + Subcontract + Other Cost
```

All values rounded to **2 decimal places** (`roundCurrency`).

### 3.2 BOQ Line Amount

```
Total Amount = Quantity × Total Rate
```

### 3.3 Rate Analysis Line Amount

```
Base = Consumption × Unit Cost × (1 + Waste% / 100)
If Productivity > 0: Amount = Base / Productivity
Else: Amount = Base
```

### 3.4 Category Rate on BOQ Item

Each BOQ category rate equals the **sum of rate analysis line amounts** for that category.

### 3.5 Resource Totals (Project)

Mirrors RPC `boq_category_totals`:

```
Material Total    = Σ (Quantity × Material Rate)
Labor Total       = Σ (Quantity × Labor Rate)
Equipment Total   = Σ (Quantity × Equipment Rate)
Subcontract Total = Σ (Quantity × Subcontract Rate)
Grand Total       = Σ (Total Amount)
```

### 3.6 Direct Cost

```
Direct Cost = Σ (BOQ Total Amount)
```

### 3.7 Estimate Summary (Project Markups)

Applied in order on **Direct Cost**:

| Step | Formula |
|------|---------|
| OCM (Indirect) | `Direct × OCM%` |
| Contingency | `(Direct + OCM) × Contingency%` |
| Profit (Markup) | `(Direct + OCM + Contingency) × Profit%` |
| VAT | `(Direct + OCM + Contingency + Profit) × VAT%` |
| **Grand Total** | `Direct + OCM + Contingency + Profit + VAT` |

Each step is rounded to 2 dp before the next step.

### 3.8 Demo Markup Percentages

| Markup | % |
|--------|---|
| OCM (Indirect) | 10 |
| Contingency | 5 |
| Profit | 8 |
| VAT | 12 |

---

## 4. Calculation Order

```
1. Rate analysis lines → category rates per BOQ item
2. Category rates → total rate per BOQ item
3. Quantity × total rate → line total amount
4. Sum line amounts → direct cost
5. Apply OCM → contingency → profit → VAT → grand total
6. WBS rollup → discipline breakdown
7. Bid summary mirrors estimate breakdown
```

---

## 5. Cross-Validation Rules

The validation engine **fails** if any of these diverge by more than **±0.01**:

| Check | Rule |
|-------|------|
| BOQ ↔ Direct Cost | `Σ total_amount = estimate_summary.direct_cost` |
| BOQ ↔ Resource Grand | `boq_category_totals.grand_total = direct cost` |
| Estimate ↔ Bid | `estimate_summary.grand_total = bid_summary.grand_total` |
| WBS Rollup | Root combined total = BOQ sum |
| Rate Analysis | Category line sums = BOQ category rates |
| Recomputation | Stored breakdown = `calculateEstimateBreakdown(direct, %)` |

---

## 6. Expected Totals (100-Item Demo)

Deterministic seed `88001`. Regenerate with:

```bash
npm run demo:formula-validation
npm run verify:estimating-engine
```

| Component | Amount (USD) |
|-----------|-------------|
| **Direct Cost** | 51,996,532.64 |
| OCM (10%) | 5,199,653.26 |
| Contingency (5%) | 2,859,809.30 |
| Profit (8%) | 4,804,479.62 |
| VAT (12%) | 7,783,256.98 |
| **Grand Total** | **72,643,731.80** |

### Resource Breakdown

| Category | Extended Total |
|----------|---------------|
| Material | 22,389,421.00 |
| Labor | 3,166,027.27 |
| Equipment | 6,227,523.92 |
| Subcontract | 20,148,269.35 |
| **BOQ Sum** | **51,996,532.64** |

---

## 7. Validation Checklist

- [x] Resource totals match `quantity × rate` per category
- [x] Each BOQ line amount = `quantity × total rate`
- [x] Rate analysis category sums = BOQ category rates
- [x] WBS direct totals per node
- [x] WBS combined rollup = BOQ sum
- [x] Discipline breakdown = WBS root totals
- [x] Direct cost = BOQ sum
- [x] OCM, contingency, profit, VAT cascade
- [x] Grand total = bid summary grand total
- [x] Zero quantity → zero amount
- [x] Large quantity (1,000,000) — no overflow
- [x] Decimal quantity (12.375) — correct rounding
- [x] Manual rate override precedence
- [x] Rate library sync changes line amount
- [x] Negative inputs rejected
- [x] Duplicate library resource detection
- [x] Performance: 100 / 500 / 1000 items under 2 seconds

---

## 8. Known Assumptions

1. **Rounding** — All currency values use half-up rounding to 2 decimal places at each step.
2. **Tolerance** — Automated tests allow ±0.01 variance for floating-point accumulation.
3. **Currency** — Demo uses USD columns; unit costs reflect Philippine construction magnitudes.
4. **Project markups only** — Demo BOQ rates are pre-markup unit rates; OCM/contingency/profit/VAT apply at estimate summary level (not per-item rate build-up markups).
5. **Rate analysis** — Each BOQ item has 2–4 resource lines; subcontract lines appear on every 7th item.
6. **Seeded randomness** — BOQ quantities and consumptions use seed `88001` for reproducibility.
7. **No production changes** — Validation runs in `scripts/` without modifying application routes or services.

---

## 9. Running the Suite

### Automated validation (required for acceptance)

```bash
npm run verify:estimating-engine
```

Expected output: `RESULT: PASS`

### Generate database seed SQL

```bash
npm run demo:formula-validation
```

Output: `supabase/seed-formula-validation-demo.sql`

Apply in Supabase SQL Editor after migrations and user provisioning.

### Related scripts

```bash
npm run verify:rate-analysis   # Rate build-up unit tests
npm run rc:verify              # RC calculation gate
```

---

## 10. File Reference

| File | Purpose |
|------|---------|
| `scripts/verify-estimating-engine.mjs` | Main PASS/FAIL validation runner |
| `scripts/lib/estimating-formulas.mjs` | Formula implementations (mirrors `lib/*`) |
| `scripts/lib/formula-validation-demo-data.mjs` | Demo WBS, BOQ, resource library data |
| `scripts/generate-formula-validation-demo.mjs` | SQL seed generator |
| `scripts/seed-formula-validation-demo.mjs` | Seed instructions helper |
| `supabase/seed-formula-validation-demo.sql` | Generated demo project SQL |

---

## 11. Acceptance Criteria

Sprint 8 is complete when:

- `npm run verify:estimating-engine` exits **0** with `RESULT: PASS`
- No formula mismatch between BOQ, estimate, bid, and WBS
- No rounding mismatch beyond ±0.01 tolerance
- Performance benchmarks complete under 2 seconds for 1,000 items
