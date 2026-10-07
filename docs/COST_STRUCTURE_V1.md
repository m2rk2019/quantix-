# Cost Structure Specification — Quantix Version 1

| Field | Value |
|-------|-------|
| **Document** | COST_STRUCTURE_V1 |
| **Product** | Quantix |
| **Version** | 1.0 |
| **Status** | Draft |
| **Last Updated** | 2026-06-25 |
| **Related** | [SRS_QUANTIX_V1.md](./SRS_QUANTIX_V1.md) · [DATABASE_DESIGN_V1.md](./DATABASE_DESIGN_V1.md) · [PROJECT_LIFECYCLE_V1.md](./PROJECT_LIFECYCLE_V1.md) · [UI_SPEC_V1.md](./UI_SPEC_V1.md) |

---

## 1. Purpose

This document defines the **standard estimating cost structure** for Quantix V1: the cost categories used on every Bill of Quantities (BOQ) line item, how rates and amounts are calculated, and how line-level costs roll up to project totals.

It answers:

- What cost categories exist at the BOQ line level?
- How is **Total Rate** and **Total Amount** computed?
- Which values feed **Direct Cost** and **Grand Total**?
- How does this structure extend to future modules without breaking V1?

**Out of scope:** Implementation code, SQL migrations, UI components, or spreadsheet formulas.

---

## 2. Cost Hierarchy

Quantix V1 uses a three-tier cost model:

```
BOQ Line Item (unit-rate components)
        ↓  × Quantity
BOQ Line Total Amount
        ↓  SUM per WBS / project
Direct Cost (estimate_summary.direct_cost)
        ↓  + Indirect + Contingency + Markup + VAT
Grand Total (estimate_summary.grand_total)
```

| Level | Source | Description |
|-------|--------|-------------|
| **Line rate** | `boq_items.*_rate` columns | Unit cost broken into standard categories |
| **Line amount** | `boq_items.total_amount` | Quantity × Total Rate for one BOQ row |
| **Direct cost** | Sum of all BOQ `total_amount` | Total estimated construction cost before project overhead |
| **Grand total** | `estimate_summary.grand_total` | Final project estimate including overhead and tax |

Project overhead components (**Indirect Cost**, **Contingency**, **Markup**, **VAT**) are **not** BOQ line categories. They are applied at the **Estimate Summary** level after direct cost is summed.

---

## 3. Standard Cost Categories (BOQ Line Level)

Quantix V1 defines **five** unit-rate cost categories on every BOQ line item. Together they form the **Total Rate** for that line.

| # | Category | Database column (V1) | Unit |
|---|----------|----------------------|------|
| 1 | Material | `material_rate` | Currency per unit of measure |
| 2 | Labor | `labor_rate` | Currency per unit of measure |
| 3 | Equipment | `equipment_rate` | Currency per unit of measure |
| 4 | Subcontract | `subcontract_rate` | Currency per unit of measure |
| 5 | Other Cost | `other_cost_rate` | Currency per unit of measure |

> **Schema note:** [DATABASE_DESIGN_V1.md](./DATABASE_DESIGN_V1.md) originally defined four rate columns. **Other Cost** is added by this specification as an additive column (`other_cost_rate`) before BOQ implementation (Sprint 5). Existing four-category formulas are extended — no existing columns are renamed or removed.

All rate fields use `NUMERIC(15, 2)`, default `0`, and must be `>= 0`.

---

## 4. Category Definitions

### 4.1 Material

| Attribute | Definition |
|-----------|------------|
| **Description** | Cost of physical materials and supplies required to complete the work item per unit of measure. Includes raw materials, manufactured products, consumables, and delivery to site when priced as part of the material supply (not as a separate preliminaries line). |
| **Examples** | Concrete, steel reinforcement, bricks, paint, pipes, fittings, aggregate, formwork timber (purchase cost). |
| **Calculation rules** | Entered as a **unit rate** per BOQ unit (e.g. $/m³, $/kg). The line does not store extended material quantity breakdown in V1 — the estimator enters the composite unit rate. |
| **Editable fields** | `material_rate` — editable on BOQ line when user has BOQ edit permission per [AUTHORIZATION_V1.md](./AUTHORIZATION_V1.md) and [PROJECT_LIFECYCLE_V1.md](./PROJECT_LIFECYCLE_V1.md). |
| **Included in Total Rate?** | **Yes** |
| **Included in Grand Total?** | **Yes** — via `total_amount` → `direct_cost` → `grand_total` |

---

### 4.2 Labor

| Attribute | Definition |
|-----------|------------|
| **Description** | Cost of direct labour required to execute the work item per unit of measure. Includes wages, on-costs allocated to direct work, and labour burden when priced as part of the unit rate. |
| **Examples** | Formwork carpenter hours, steel fixer, concreter, general labourer, skilled trades allocated to the measured item. |
| **Calculation rules** | Entered as a **unit rate** representing labour cost per BOQ unit. May implicitly include productivity assumptions (e.g. hours per m² × hourly rate) but V1 does not decompose labour into hours and rates separately. |
| **Editable fields** | `labor_rate` |
| **Included in Total Rate?** | **Yes** |
| **Included in Grand Total?** | **Yes** — via rollup chain |

---

### 4.3 Equipment

| Attribute | Definition |
|-----------|------------|
| **Description** | Cost of plant, machinery, tools, and equipment attributable to the work item per unit of measure. Includes hire charges, fuel, operator cost when bundled in equipment rate, and depreciation allocation when priced into the unit rate. |
| **Examples** | Excavator hire, crane time, concrete pump, compactor, power tools, scaffolding hire allocated to the item. |
| **Calculation rules** | Entered as a **unit rate** per BOQ unit. Equipment used across multiple items may be split by the estimator across relevant BOQ lines. |
| **Editable fields** | `equipment_rate` |
| **Included in Total Rate?** | **Yes** |
| **Included in Grand Total?** | **Yes** — via rollup chain |

---

### 4.4 Subcontract

| Attribute | Definition |
|-----------|------------|
| **Description** | Cost of work packages to be performed by a subcontractor, priced per unit of measure for the BOQ line. Represents the all-in subcontract unit rate for the scoped portion of work. |
| **Examples** | Specialist piling subcontract, curtain wall installation, MEP package rate per point, waterproofing subcontract per m². |
| **Calculation rules** | Entered as a **unit rate** per BOQ unit. When an entire package is subcontracted, Material, Labor, and Equipment rates for that line may be `0` and the full cost sits in Subcontract. |
| **Editable fields** | `subcontract_rate` |
| **Included in Total Rate?** | **Yes** |
| **Included in Grand Total?** | **Yes** — via rollup chain |

---

### 4.5 Other Cost

| Attribute | Definition |
|-----------|------------|
| **Description** | Cost elements that do not fit Material, Labor, Equipment, or Subcontract but are directly attributable to the BOQ line per unit of measure. Captures miscellaneous direct costs required for estimating completeness. |
| **Examples** | Small tools and consumables not in material, permits and fees allocated to the item, testing and inspection charges per unit, temporary works specific to the line, design coordination fees allocated per unit. |
| **Calculation rules** | Entered as a **unit rate** per BOQ unit. Should not be used for project-level overhead (use Estimate Summary indirect/contingency instead). Should not duplicate categories already captured in Material–Subcontract. |
| **Editable fields** | `other_cost_rate` |
| **Included in Total Rate?** | **Yes** |
| **Included in Grand Total?** | **Yes** — via rollup chain |

---

## 5. Summary Matrix

| Category | In Total Rate? | In Direct Cost? | In Grand Total? | BOQ editable (V1) |
|----------|:--------------:|:---------------:|:---------------:|:-----------------:|
| Material | Yes | Yes (via line amount) | Yes | Yes |
| Labor | Yes | Yes | Yes | Yes |
| Equipment | Yes | Yes | Yes | Yes |
| Subcontract | Yes | Yes | Yes | Yes |
| Other Cost | Yes | Yes | Yes | Yes |
| Indirect Cost | No | No | Yes | Estimate Summary only |
| Contingency | No | No | Yes | Estimate Summary only |
| Markup | No | No | Yes | Estimate Summary only |
| VAT | No | No | Yes | Estimate Summary only |

---

## 6. Core Formulas

### 6.1 Total Rate (per BOQ line)

```
Total Rate = Material + Labor + Equipment + Subcontract + Other Cost
```

Expanded to database columns:

```
total_rate = material_rate
           + labor_rate
           + equipment_rate
           + subcontract_rate
           + other_cost_rate
```

| Property | Rule |
|----------|------|
| Precision | 2 decimal places (`NUMERIC(15, 2)`) |
| Storage | `total_rate` is **stored** (denormalized) on `boq_items` |
| Recalculation | Updated whenever any category rate or `quantity` changes |
| Minimum | `0` — negative rates are rejected |

---

### 6.2 Total Amount (per BOQ line)

```
Total Amount = Quantity × Total Rate
```

Expanded:

```
total_amount = quantity × total_rate
```

| Property | Rule |
|----------|------|
| Precision | 2 decimal places |
| Storage | `total_amount` is **stored** on `boq_items` |
| Quantity | `quantity >= 0`; unit of measure on `boq_items.unit` |
| Display | BOQ table shows `total_rate` and `total_amount` as read-only computed columns |

---

### 6.3 Direct Cost (project level)

```
Direct Cost = SUM(Total Amount) for all BOQ line items in the project
```

```
estimate_summary.direct_cost = SUM(boq_items.total_amount)
  WHERE project_id = ? AND deleted_at IS NULL
```

Direct Cost is the sum of **all five categories** across **all lines** — no category is excluded from direct cost.

---

### 6.4 Grand Total (project level)

```
Grand Total = Direct Cost + Indirect Cost + Contingency + Markup + VAT
```

```
estimate_summary.grand_total = direct_cost
                             + indirect_cost
                             + contingency
                             + markup
                             + vat
```

| Component | Level | In Total Rate? | In Grand Total? |
|-----------|-------|:--------------:|:---------------:|
| Material–Other Cost | BOQ line | Contributes via Total Rate | Yes (via Direct Cost) |
| Indirect Cost | Estimate Summary | No | Yes |
| Contingency | Estimate Summary | No | Yes |
| Markup | Estimate Summary | No | Yes |
| VAT | Estimate Summary | No | Yes |

---

## 7. Rollup Behaviour

### 7.1 WBS Rollup

WBS nodes do not store category breakdowns in V1. Each WBS node displays:

```
WBS Subtotal = SUM(total_amount) of BOQ items directly on that node
             + SUM(subtotals) of all descendant WBS nodes
```

Category detail is visible at the **BOQ line** level only. WBS and Estimate Summary tree views show **combined amounts**.

### 7.2 Category Totals (read-only, V1)

The Estimate Summary or BOQ module may display optional **project-level category totals** for analysis:

```
Material Total  = SUM(quantity × material_rate)   across all BOQ lines
Labor Total     = SUM(quantity × labor_rate)
...
```

These are **derived at read time** for display and export — not stored as separate columns in V1.

---

## 8. Rounding and Precision Rules

| Rule | Detail |
|------|--------|
| RS-01 | All currency values use 2 decimal places. |
| RS-02 | Rate components are rounded to 2 decimals **before** summing into `total_rate`. |
| RS-03 | `total_amount` is rounded to 2 decimals after `quantity × total_rate`. |
| RS-04 | `direct_cost` is the exact sum of stored `total_amount` values (no intermediate rounding). |
| RS-05 | `grand_total` is rounded to 2 decimals after summing overhead components. |
| RS-06 | Half-up rounding applies unless locale rules specify otherwise in a future release. |

---

## 9. Excel Export Mapping

Per SRS FR-EXP, the **BOQ Detail** sheet includes:

| Export column | Source |
|---------------|--------|
| Item Code | `boq_items.item_code` |
| Description | `boq_items.description` |
| Unit | `boq_items.unit` |
| Quantity | `boq_items.quantity` |
| Material Rate | `boq_items.material_rate` |
| Labor Rate | `boq_items.labor_rate` |
| Equipment Rate | `boq_items.equipment_rate` |
| Subcontract Rate | `boq_items.subcontract_rate` |
| Other Cost Rate | `boq_items.other_cost_rate` |
| Total Rate | `boq_items.total_rate` |
| Amount | `boq_items.total_amount` |

The **Project Info** sheet includes `grand_total` from `estimate_summary`.

---

## 10. Lifecycle and Edit Rules

Cost category rates follow the same edit permissions as BOQ line items per [PROJECT_LIFECYCLE_V1.md](./PROJECT_LIFECYCLE_V1.md):

| Project status | Material–Other Cost editable by |
|----------------|--------------------------------|
| Draft | Estimator (own), QS, Admin, Super Admin |
| In Progress | Estimator (own), QS, Admin, Super Admin |
| For Review | QS, Admin, Super Admin only (Estimator locked) |
| Approved | Admin, Super Admin only (exceptional correction) |
| Archived | None (read-only) |

Overhead fields on Estimate Summary follow the same lifecycle rules as project metadata and estimate summary per PROJECT_LIFECYCLE_V1.

---

## 11. Validation Rules

| ID | Rule |
|----|------|
| CV-01 | All rate fields must be `>= 0`. |
| CV-02 | `quantity` must be `>= 0`. |
| CV-03 | At least one of Material, Labor, Equipment, Subcontract, or Other Cost may be non-zero for a priced line (all zero is allowed for placeholder rows). |
| CV-04 | `total_rate` and `total_amount` are system-calculated — users cannot override stored values directly. |
| CV-05 | Category rates on a subcontract-dominated line may have Material/Labor/Equipment as `0` and Subcontract as the full rate. |
| CV-06 | Other Cost must not be used to store project overhead (indirect, contingency, markup, VAT). |

---

## 12. Future Compatibility

The V1 five-category BOQ structure is designed as a **stable foundation**. Future modules attach metadata and workflows to existing categories and line items — they do not redefine the cost structure.

### 12.1 Procurement (Version 2)

| Aspect | Compatibility |
|--------|---------------|
| **Link** | `purchase_order_lines.boq_item_id` → `boq_items.id` |
| **Category mapping** | PO line type maps to BOQ category: material PO → Material, labour hire → Labor, plant hire → Equipment, subcontract PO → Subcontract |
| **Rates** | Estimated `*_rate` on BOQ compared to actual PO unit cost for variance |
| **Direct cost** | Remains sum of BOQ `total_amount`; actuals tracked in parallel, not merged into V1 columns |
| **Other Cost** | Miscellaneous procurement charges link to `other_cost_rate` lines or dedicated PO misc type |

### 12.2 Contracts (Version 2)

| Aspect | Compatibility |
|--------|---------------|
| **Baseline** | Approved estimate `grand_total` and BOQ line `total_amount` values become contract baseline |
| **Variations** | New BOQ lines or adjusted rates on existing lines; category breakdown preserved for variation valuation |
| **Category split** | Contract variation reports show Material/Labor/Equipment/Subcontract/Other Cost movement per line |
| **No restructure** | Contract module references BOQ items — does not replace `*_rate` columns |

### 12.3 Cash Flow (Version 2)

| Aspect | Compatibility |
|--------|---------------|
| **Baseline** | `estimate_summary.grand_total` and monthly BOQ category splits drive S-curve baseline |
| **Category weighting** | Material-heavy items cash-flow earlier than labour-heavy; category rates enable weighted profiles per line |
| **Direct vs overhead** | Direct cost (BOQ sum) flows separately from indirect/contingency/markup/VAT in cash flow periods |
| **Stored fields** | Cash flow reads V1 BOQ and estimate_summary — no new columns on `boq_items` required |

### 12.4 AI Cost Analysis (Version 3)

| Aspect | Compatibility |
|--------|---------------|
| **Training features** | Five category rates per line provide structured features for ML models (material/labour mix, subcontract ratio) |
| **Suggestions** | AI proposes adjustments per category (`material_rate`, `labor_rate`, etc.) — human approves before write |
| **Benchmarking** | Historical category totals aggregated from `quantity × *_rate` across projects |
| **Anomaly detection** | Flag lines where category mix deviates from portfolio norms (e.g. abnormally low labour on labour-intensive item) |
| **No schema change** | AI reads and suggests against existing columns; optional `ai_suggestions` staging table in V3 |

### 12.5 Extension Principles

1. **BOQ line is the cost atom** — all direct cost originates from five category rates × quantity.
2. **Additive only** — new modules add tables and references; V1 columns are not renamed or repurposed.
3. **Category enum is stable** — `material | labor | equipment | subcontract | other_cost` is the canonical set for V1–V3.
4. **Overhead stays at summary level** — indirect, contingency, markup, and VAT are never mixed into BOQ category rates.
5. **Grand Total formula is stable** — future modules read `grand_total`; they do not redefine it.

---

## 13. Relationship to Cost Libraries (V1.5)

The V1.5 **Cost Libraries** feature (per [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md)) will store default unit rates per category:

```
cost_library_items (
  category: material | labor | equipment | subcontract | other_cost,
  unit_rate,
  unit,
  description
)
```

Applying a library item to a BOQ line populates the matching `*_rate` column. The five-category structure defined here is the library indexing model.

---

## 14. Glossary

| Term | Definition |
|------|------------|
| **Unit rate** | Cost per single unit of measure for one category on one BOQ line |
| **Total rate** | Sum of all category unit rates on a BOQ line |
| **Total amount** | Extended cost for a BOQ line (quantity × total rate) |
| **Direct cost** | Sum of all BOQ total amounts — pre-overhead project cost |
| **Grand total** | Final estimate including direct cost and summary-level overhead/tax |
| **Category** | One of Material, Labor, Equipment, Subcontract, Other Cost |
| **Overhead** | Indirect cost, contingency, markup, and VAT at Estimate Summary level |

---

## 15. Out of Scope

- Resource-based estimating (hours × wage rates decomposed in UI)
- Multi-currency BOQ lines
- Escalation and inflation indices
- Tax schemes beyond a single VAT line
- Implementation code, SQL, or migration scripts
- Cost library schema (V1.5)

---

## 16. Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Commercial Lead | | | |
| Technical Lead | | | |

---

*End of Document*
