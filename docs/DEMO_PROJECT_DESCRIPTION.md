# Demo Project — Megawide Office Building

| Field | Value |
|-------|-------|
| **Project name** | Megawide Office Building |
| **Project code** | `QTX-PILOT-MEGAWIDE-001` |
| **Project ID** | `e1a11111-1111-4111-a111-111111111101` |
| **Client** | Megawide Construction Corporation |
| **Location** | Makati City, Philippines |
| **Currency** | PHP (₱) |
| **Status** | Estimating |
| **Grand total** | ~₱450M (within ₱300M–₱600M pilot range) |

---

## Overview

The Megawide Office Building is Quantix V1’s **local pilot demo project**. It provides a complete, realistic Philippine commercial office estimate so pilot users can test workflows without building data from scratch.

The dataset is deterministic: the same seed always produces the same WBS structure, BOQ lines, rates, and totals.

---

## Scope

### Building

- **Type:** 12-storey Grade A office building
- **Use:** Commercial office
- **Measurement:** Metric (m², m³, kg, m, pc, lot)

### WBS (20 nodes)

| Level | Structure |
|-------|-----------|
| Root | Megawide Office Building |
| Group 1 | Civil & Structural |
| Group 2 | Architectural |
| Group 3 | MEPF |
| Group 4 | External Works |
| Leaves (15) | One discipline per Philippine construction trade |

### Disciplines (15)

1. Concrete  
2. Rebars  
3. Formworks  
4. Masonry  
5. Structural Steel  
6. Roofing  
7. Ceiling  
8. Doors  
9. Windows  
10. Painting  
11. Plumbing  
12. Fire Protection  
13. Electrical  
14. HVAC  
15. External Works  

### BOQ

- **600 line items** distributed across discipline WBS leaves  
- Item codes: `MWB-0001` … `MWB-0600`  
- Each line includes material, labor, equipment, and (where applicable) subcontract rates  
- Rate analysis lines linked to the company resource library  

### Company resource library

Philippine-market rates for:

- Materials (cement, rebar, formwork, masonry, steel, roofing, MEP, etc.)
- Labor (mason, carpenter, electrician, plumber, etc.)
- Equipment (concrete pump, crane, compactor, etc.)
- Subcontract packages (curtain wall, fire protection, etc.)
- Suppliers, units, and categories

### Estimate summary

| Component | Rate |
|-----------|------|
| Direct cost | Sum of BOQ |
| OCM (indirect) | 10% |
| Contingency | 5% |
| Markup (profit) | 8% |
| VAT | 12% |

### Bid summary

Computed from the same breakdown as Estimate Summary (direct cost through grand total).

### Historical benchmark

- `is_benchmark = true` on project details  
- 600 `project_benchmark_actuals` rows with realistic ±3–6% variance vs estimate  

### Executive dashboard

When loaded, the project contributes to portfolio KPIs (estimated value, discipline breakdown, resource usage).

---

## Consistency guarantees

The seed is validated in-memory before apply:

| Check | Requirement |
|-------|-------------|
| WBS rollup | = BOQ direct cost |
| BOQ total | = Estimate Summary direct cost |
| Estimate grand total | = Bid Summary grand total |
| Resource totals | = BOQ direct cost |
| Validation snapshot | 0 failures |
| Grand total | ₱300M–₱600M |

Run `npm run verify:megawide-office` after loading.

---

## Load and reset

| Action | Command | Admin UI |
|--------|---------|----------|
| Load demo | `npm run load:demo` | `/admin/demo` → **Load Demo Project** |
| Reset demo | `npm run reset:demo` | `/admin/demo` → **Reset Demo Database** |
| Regenerate SQL only | `npm run demo:megawide` | — |
| Verify | `npm run verify:megawide-office` | — |

**Reset** removes:

- The Megawide project (cascades WBS, BOQ, rate lines, benchmark actuals)
- Company library rows with IDs prefixed `e1d%`

**Load** regenerates SQL, then applies the full dataset via Supabase service role.

---

## Pilot test paths

After loading, verify these routes:

| Route | What to check |
|-------|----------------|
| `/projects/{id}/wbs` | 20 nodes, 4 groups + 15 disciplines |
| `/projects/{id}/boq` | 600 items, discipline filters |
| `/projects/{id}/rates` | Rate analysis on sample lines |
| `/projects/{id}/summary` | Estimate + bid totals match |
| `/projects/{id}/summary` (Validation) | All checks PASS |
| `/projects/{id}/ai-estimator` | Project context loads |
| `/admin/benchmarks?projectId={id}` | Benchmark recognizes project |
| `/dashboard` | KPIs include ~₱450M project |

---

## Technical notes

- Seed logic: `scripts/lib/megawide-office-demo-data.mjs`
- SQL output: `supabase/seed-megawide-office-building.sql`
- Estimating formulas are **not modified** — seed uses `scripts/lib/estimating-formulas.mjs` mirrors only
- Demo IDs use prefix `e1` to avoid collision with other demos (`a111…`, `f8a…`, `b201…`)

---

## Related documentation

- [PILOT_TEST_GUIDE.md](./PILOT_TEST_GUIDE.md) — pilot workflow with demo steps  
- [QUANTIX_V1_USER_GUIDE.md](./QUANTIX_V1_USER_GUIDE.md) — full product guide  
- [HISTORICAL_BENCHMARK.md](./HISTORICAL_BENCHMARK.md) — benchmark module  
