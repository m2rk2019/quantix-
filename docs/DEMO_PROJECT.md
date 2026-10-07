# Demo Project — 5-Storey Office Building

| Field | Value |
|-------|-------|
| **Document** | DEMO_PROJECT |
| **Product** | Quantix |
| **Version** | 1.0 |
| **Last Updated** | 2026-06-25 |
| **Related** | [COST_STRUCTURE_V1.md](./COST_STRUCTURE_V1.md) · [UAT_CHECKLIST.md](./UAT_CHECKLIST.md) · [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) |

---

## 1. Purpose

This demo project provides a **realistic commercial building estimate** for:

- Sales demonstrations and stakeholder walkthroughs
- UAT and performance testing (pagination, virtual scroll, export)
- Training estimators and quantity surveyors on Quantix workflows

It does **not** add application features. Data is delivered as a **SQL seed** and an **Excel import-ready workbook**.

---

## 2. Project Overview

| Attribute | Value |
|-----------|-------|
| **Project name** | Riverside Commerce Centre — 5-Storey Office Building |
| **Project code** | `QTX-2026-900001` |
| **Fixed project ID** | `a1111111-1111-4111-a111-111111111101` |
| **Client** | Meridian Property Group |
| **Location** | 14 Riverside Way, Manchester, UK |
| **Building type** | 5-storey Grade A office (+ basement parking, roof plant) |
| **Status** | In Progress |
| **Currency** | GBP (£) |
| **Contract** | Lump sum |
| **Owner** | Meridian Property Group |
| **Consultant** | Halewood Design Partners |
| **Contractor** | Northline Construction Ltd |

### 2.1 Scope narrative

New-build office accommodation comprising ground-floor reception, four typical open-plan floors, Level 5 executive suite, roof-level plant, and basement car parking for 120 vehicles. Envelope includes curtain-wall glazing, built-up roofing, and feature entrance. MEP covers VRF HVAC, electrical/ELV, sprinklers, and BMS.

---

## 3. Dataset Summary

| Dataset | Count | Notes |
|---------|-------|-------|
| **WBS nodes** | 150 | 4 levels — project → division → package → detail |
| **BOQ items** | 2,000 | Minimum 13–14 lines per WBS node (validation-compliant) |
| **Units used** | m², m³, kg, nr, m, lot | Metric per project settings |

### 3.1 Estimate summary (GBP)

Percentages: Indirect **8%** · Contingency **5%** · Markup **10%** · VAT **20%**

| Component | Amount (GBP) |
|-----------|--------------|
| Direct Cost | 28,755,228.61 |
| Indirect Cost | 2,300,418.29 |
| Contingency | 1,552,782.35 |
| Markup | 3,260,842.93 |
| VAT | 7,173,854.44 |
| **Grand Total** | **43,043,126.62** |

*Totals are computed from seeded BOQ line amounts using [COST_STRUCTURE_V1.md](./COST_STRUCTURE_V1.md) formulas. Re-run `npm run demo:generate` to regenerate with the same seed logic; amounts may vary slightly if generator logic changes.*

---

## 4. WBS Structure

```
1.0  Riverside Commerce Centre — 5-Storey Office Building
├── 1.1   Preliminaries & General Requirements          (10 packages)
├── 1.2   Site Works & Earthworks                       (10 packages)
├── 1.3   Substructure & Foundations                    (10 packages)
├── 1.4   Superstructure — Frame & Slabs                (10 packages)
├── 1.5   Building Envelope                             (10 packages)
├── 1.6   Architectural Finishes — Typical Floors       (10 packages)
├── 1.7   Level 5 & Roof Finishes                       (10 packages)
├── 1.8   Vertical Transportation                      (10 packages)
├── 1.9   Mechanical Services (HVAC & Plumbing)         (10 packages)
├── 1.10  Electrical & ELV Services                     (10 packages)
├── 1.11  Fire Protection & Security                      (10 packages)
└── 1.12  External Works & Landscaping                  (10 packages)
        └── 1.x.y   Work packages (Level 3)
              └── 1.x.y.z   Detail scope packages (Level 4) — 17 nodes
```

**Hierarchy:** 1 root + 12 divisions + 120 work packages + 17 detail nodes = **150 nodes**.

---

## 5. BOQ Characteristics

Each BOQ line includes all five rate categories per [COST_STRUCTURE_V1.md](./COST_STRUCTURE_V1.md):

| Column | Description |
|--------|-------------|
| Material Rate | Physical materials and supplies |
| Labor Rate | Labour and fixing |
| Equipment Rate | Plant and equipment |
| Subcontract Rate | Subcontracted packages |
| Other Cost Rate | Sundries, testing allowances, coordination |

**Calculations (enforced in seed data):**

- `total_rate` = sum of five rates (rounded 2 dp)
- `total_amount` = `quantity × total_rate` (rounded 2 dp)

**Item codes:** `DEMO-00001` … `DEMO-02000`

**Sample descriptions:**

- *Supply and install raised access flooring L1–L4 — line 3*
- *Prepare and pour reinforced concrete columns*
- *Allowance for passenger lifts — 3 nr high-speed — lump sum*
- *Supply and erect reinforcement to pile caps & ground beams*

---

## 6. Files

| File | Purpose |
|------|---------|
| [supabase/seed-demo-office-building.sql](../supabase/seed-demo-office-building.sql) | PostgreSQL seed — load into Supabase |
| [samples/Demo_Office_Building_BOQ_Import.xlsx](../samples/Demo_Office_Building_BOQ_Import.xlsx) | Excel import-ready reference workbook |
| [scripts/generate-demo-project.mjs](../scripts/generate-demo-project.mjs) | Regenerates SQL + Excel |

### 6.1 Excel workbook sheets

| Sheet | Content |
|-------|---------|
| **README** | Usage notes and summary totals |
| **WBS** | All 150 WBS codes, levels, descriptions |
| **Estimate_Summary** | Direct through grand total |
| **BOQ_Import** | 2,000 rows — columns aligned with Quantix BOQ grid and export format |

**BOQ_Import columns:** Item No., WBS Code, Description, Unit, Quantity, Material Rate, Labor Rate, Equipment Rate, Subcontract Rate, Other Cost Rate, Total Rate, Total Amount.

> **Note:** Quantix V1 does not support Excel **import** in the application. This file is for reference, offline review, future import tooling, and demo data exchange.

---

## 7. Loading the Demo Project

### 7.1 Prerequisites

1. All Supabase migrations applied (see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) §5).
2. At least one row in `public.users` linked to Supabase Auth.

### 7.2 Apply SQL seed

**Supabase SQL Editor:**

1. Open `supabase/seed-demo-office-building.sql`.
2. Paste full contents into SQL Editor.
3. Run.

The script:

- Resolves `v_owner` from the first active `super_admin` (or any active user).
- Removes any previous demo data for the fixed project ID (idempotent re-run).
- Inserts project, details, estimate summary, 150 WBS nodes, 2,000 BOQ items, and one audit entry.

### 7.3 Verify in Quantix

1. Log in as a user with access to the project (owner or admin/QS).
2. Open **Projects** → search `QTX-2026-900001` or *Riverside*.
3. Confirm tabs: **WBS** (150 nodes), **BOQ** (2,000 items, paginated), **Estimate Summary** (totals above), **Validation** (should pass if data intact), **Audit History**.
4. Optional: **Export to Excel** and compare totals to this document.

### 7.4 Regenerate data

```bash
npm run demo:generate
```

Re-run after changing generator logic. Commit updated SQL and Excel if publishing new demo versions.

---

## 8. Suggested Demo Script (15 minutes)

| Step | Action | Highlight |
|------|--------|-----------|
| 1 | Dashboard → Projects → open Riverside | Project scale, status badge |
| 2 | Project Details | Client, consultants, estimate settings (8/5/10/20%) |
| 3 | WBS tab | Expand 1.4 Superstructure, search "lift" |
| 4 | BOQ tab | Filter by WBS; inline edit quantity; watch total update |
| 5 | Estimate Summary | WBS rollup panel; cost breakdown ~£43M |
| 6 | Validation | All 12 checks passed; export enabled |
| 7 | Export to Excel | 4-sheet professional workbook |
| 8 | Audit History | `project.created` and export events |

---

## 9. Use Cases

| Use case | How to use demo |
|----------|-----------------|
| **UAT performance** | BOQ pagination (10 pages × 200), WBS virtual scroll |
| **Export timeout test** | Full 2,000-line export on staging/Vercel |
| **Training** | Safe sandbox; delete and re-seed via SQL |
| **Sales demo** | Realistic £43M commercial narrative |
| **Calculation check** | Compare summary to Excel `Estimate_Summary` sheet |

---

## 10. Cleanup

Re-running the seed replaces demo data for project ID `a1111111-1111-4111-a111-111111111101`.

To remove without re-seed:

```sql
DELETE FROM public.boq_items WHERE project_id = 'a1111111-1111-4111-a111-111111111101';
DELETE FROM public.wbs WHERE project_id = 'a1111111-1111-4111-a111-111111111101';
DELETE FROM public.estimate_summary WHERE project_id = 'a1111111-1111-4111-a111-111111111101';
DELETE FROM public.project_details WHERE project_id = 'a1111111-1111-4111-a111-111111111101';
DELETE FROM public.audit_log WHERE project_id = 'a1111111-1111-4111-a111-111111111101';
DELETE FROM public.projects WHERE id = 'a1111111-1111-4111-a111-111111111101';
```

---

## 11. Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Commercial lead | | | |

---

*End of Document*
