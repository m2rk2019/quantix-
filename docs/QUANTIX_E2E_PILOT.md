# Quantix Version 1 — End-to-End Pilot Project

| Field | Value |
|-------|-------|
| **Version** | 1.0.0-e2e-pilot |
| **Date** | 2026-10-08 |
| **Objective** | Validate the complete estimating workflow exactly as a real estimator uses Quantix |
| **Policy** | No new features. Do **not** modify Smart Import Engine / Import Engine V1 |
| **Fixtures** | NIA Budgetary Cost Breakdown (`samples/NIA_Budgetary_Cost_Breakdown.xlsx`) |
| **Automation** | `npm run pilot:e2e` → `scripts/e2e-pilot/run-e2e-pilot-checklist.mjs` |
| **Report** | [QUANTIX_E2E_PILOT_REPORT.md](./QUANTIX_E2E_PILOT_REPORT.md) |

Related: [PILOT_TEST_GUIDE.md](./PILOT_TEST_GUIDE.md) · [UAT_CHECKLIST.md](./UAT_CHECKLIST.md) · [IMPORT_ENGINE_V1.md](./IMPORT_ENGINE_V1.md)

---

## 0. Purpose

This pilot walks through **every production estimating path** in Version 1 (plus V1.1 Takeoff already shipped), without changing product behavior. It is both:

1. A **manual estimator script** (phases 1–13 UI steps)
2. An **automated checklist** (fixture presence, Import Engine regression, module readiness)

Automated checks cannot replace interactive UI validation for create/edit/undo flows. Those remain **MANUAL — REQUIRED** before production sign-off.

---

## 1. Prerequisites

| # | Requirement | Notes |
|---|-------------|-------|
| 1 | App runnable (`npm run dev`) | Local or staging |
| 2 | Supabase migrations applied | Including takeoff Phase 1–5 if testing Phase 12 |
| 3 | Provisioned user (estimator/admin) | `npm run deploy:provision-user` |
| 4 | NIA sample workbook present | `samples/NIA_Budgetary_Cost_Breakdown.xlsx` |
| 5 | STREVI sample present (regression) | `samples/STREVI_BCB_Breakdown.xlsx` |

---

## 2. Pilot project naming

Use a dedicated pilot project so production data is never confused:

| Field | Suggested value |
|-------|-----------------|
| Project name | `E2E Pilot — NIA Road` |
| Client | `Pilot Client` |
| Location | `Quezon City` |
| Code | System-generated (verify uniqueness) |

---

## PHASE 1 – Create Project

### Steps

1. Open **Projects** → **New Project**
2. Fill project information (name, client, location, currency if prompted)
3. **Save**
4. Confirm system-generated **project code** is shown

### PASS criteria

- [ ] Project appears in Projects list
- [ ] Project code is non-empty and unique
- [ ] Opening the project loads without error

### Automation

| Check ID | Type | Description |
|----------|------|-------------|
| P1-ROUTE | AUTO | Project create route / service files exist |
| P1-UI | MANUAL | Create + list visibility |

---

## PHASE 2 – Smart Excel Import (NIA)

### Steps

1. Open pilot project → **Smart Import** / Import workbook
2. Upload `samples/NIA_Budgetary_Cost_Breakdown.xlsx`
3. Confirm workbook & sheets recognized
4. Complete import

### Verify

| Artifact | Expected |
|----------|----------|
| Workbook recognized | Yes (NIA BCB pattern) |
| Sheets recognized | BCB Breakdown (+ Bid Summary if present) |
| WBS imported | Present (tree) |
| BOQ imported | **450** leaf items |
| Resources | Imported / derived candidates present |
| Unit Rates | Priced lines present |
| Estimate Summary | Generated |
| Direct Cost | **₱351,522,209.41** |
| Duplicates | None |

### PASS criteria

- [ ] 450 BOQ items
- [ ] Direct Cost = ₱351,522,209.41
- [ ] No duplicated rows

### Automation

| Check ID | Type | Description |
|----------|------|-------------|
| P2-FIXTURE | AUTO | NIA sample file exists |
| P2-REGRESSION | AUTO | `npm run regression:import-engine-v1` NIA leaf_count + sum + fingerprint |
| P2-UI | MANUAL | Full import into live project DB |

> Import Engine behavior is **frozen**. Automation uses the official regression harness only — no importer code changes.

---

## PHASE 3 – WBS

### Steps

1. Open **WBS**
2. Expand / collapse nodes
3. Add a test node
4. Edit description
5. Move node (reorder / parent change if supported)
6. Delete test node
7. Confirm BOQ grouping still aligns to WBS

### PASS criteria

- [ ] Expand/collapse works
- [ ] Add / Edit / Delete / Move succeed
- [ ] BOQ remains grouped under WBS correctly

### Automation

| Check ID | Type | Description |
|----------|------|-------------|
| P3-MODULE | AUTO | WBS feature/service modules present |
| P3-UI | MANUAL | Interactive tree operations |

---

## PHASE 4 – BOQ

### Steps

1. Open **BOQ**
2. Search by item code / description
3. Filter by WBS
4. Sort columns
5. Edit Quantity
6. Edit Unit Rate (material/labor/etc.)
7. Copy / Duplicate / Delete a disposable row
8. Undo / Redo
9. Confirm totals recalculate

### PASS criteria

- [ ] Search, filter, sort work
- [ ] Edits persist
- [ ] Copy / Duplicate / Delete work
- [ ] Undo / Redo restore expected state
- [ ] Totals recalculate after edits

### Automation

| Check ID | Type | Description |
|----------|------|-------------|
| P4-MODULE | AUTO | BOQ grid/module files present |
| P4-UI | MANUAL | Full grid interactions |

---

## PHASE 5 – Resource Library

### Steps

1. Open Resource / Rate Library (company or project context as shipped)
2. Create a resource
3. Edit
4. Search
5. Assign / link to a BOQ line (rate analysis path if that is the product path)
6. Delete disposable resource

### PASS criteria

- [ ] Create / Edit / Delete / Search succeed
- [ ] Assignment to BOQ succeeds

### Automation

| Check ID | Type | Description |
|----------|------|-------------|
| P5-MODULE | AUTO | Resource / rate-library modules present |
| P5-UI | MANUAL | CRUD + assign |

---

## PHASE 6 – Estimate Summary

### Steps

1. Open **Estimate Summary**
2. Verify Direct Cost, Material, Labor, Equipment, Subcontract, Other, Bid Total
3. Change a BOQ quantity
4. Refresh / reopen Estimate Summary
5. Confirm figures update

### PASS criteria

- [ ] All cost categories displayed
- [ ] Bid Total present
- [ ] Refresh after BOQ change reflects new numbers

### Automation

| Check ID | Type | Description |
|----------|------|-------------|
| P6-MODULE | AUTO | Estimate services/UI present |
| P6-UI | MANUAL | Live totals after BOQ edit |

---

## PHASE 7 – Tender Package

### Steps

1. Open **Tender**
2. Generate Tender Package
3. Preview
4. Download PDF
5. Verify totals match Estimate / BOQ direct cost expectations

### PASS criteria

- [ ] Generate succeeds
- [ ] Preview available
- [ ] PDF downloads
- [ ] Totals consistent

### Automation

| Check ID | Type | Description |
|----------|------|-------------|
| P7-MODULE | AUTO | Tender export services present (`pdf-lib` / excel paths) |
| P7-UI | MANUAL | Generate + download |

---

## PHASE 8 – Save as Master Template

### Steps

1. **Approve** the pilot project (required gate if enforced)
2. **Save as Master Template**
3. Open Master Templates list
4. Verify template created and version recorded

### PASS criteria

- [ ] Template created
- [ ] Version visible / incremented correctly

### Automation

| Check ID | Type | Description |
|----------|------|-------------|
| P8-MODULE | AUTO | Master template services/UI present |
| P8-UI | MANUAL | Approve + save template |

---

## PHASE 9 – New Project from Template

### Steps

1. Create **new project from template** (pilot template)
2. Verify copied: WBS, BOQ, Rates, Resources, Estimate

### PASS criteria

- [ ] All listed artifacts present on the new project
- [ ] Quantities/rates look consistent with source template

### Automation

| Check ID | Type | Description |
|----------|------|-------------|
| P9-MODULE | AUTO | Template reuse / create-from-template paths present |
| P9-UI | MANUAL | Full copy verification |

---

## PHASE 10 – Historical Archive

### Steps

1. **Archive** the original pilot project (or a copy)
2. Open Historical Archive
3. **Restore** (or open archived view per product behavior)
4. **Compare** versions if UI supports compare

### PASS criteria

- [ ] Archive succeeds
- [ ] Restore / view works
- [ ] Compare versions works (or N/A documented if not shipped)

### Automation

| Check ID | Type | Description |
|----------|------|-------------|
| P10-MODULE | AUTO | Historical projects routes/services present |
| P10-UI | MANUAL | Archive / restore / compare |

---

## PHASE 11 – Audit Trail

### Steps

1. Open project **Audit** log
2. Confirm create, import, BOQ edits, approve, archive (as performed) are logged

### PASS criteria

- [ ] Actions from this pilot appear with actor, timestamp, entity

### Automation

| Check ID | Type | Description |
|----------|------|-------------|
| P11-MODULE | AUTO | Audit logging services present |
| P11-UI | MANUAL | Spot-check log entries |

---

## PHASE 12 – Manual Quantity Takeoff (V1.1)

> Optional for pure V1 estimating freeze validation, **required** if V1.1 Takeoff is in the pilot scope for this environment.

### Steps

1. Open **Quantity Takeoff**
2. Upload a PDF drawing
3. Calibrate scale
4. Measure (line/area/count)
5. Assign measurement to a BOQ item
6. Confirm live BOQ quantity update
7. Confirm Coverage % on dashboard
8. Export Takeoff Report

### PASS criteria

- [ ] Upload + calibrate + measure
- [ ] BOQ assignment + live qty
- [ ] Coverage % displays
- [ ] Export Takeoff Report succeeds

### Automation

| Check ID | Type | Description |
|----------|------|-------------|
| P12-MODULE | AUTO | Takeoff module + Phase 5 BOQ link files present |
| P12-UI | MANUAL | Full takeoff workflow |

---

## PHASE 13 – Performance

Measure on a warm session (second navigation preferred):

| Screen / action | Target |
|-----------------|--------|
| Dashboard | &lt; 1 sec |
| Project list | &lt; 1 sec |
| Open Project | &lt; 2 sec |
| BOQ scroll | Smooth (no multi-second freezes) |
| Estimate refresh | &lt; 2 sec |
| Tender PDF | &lt; 5 sec |

### PASS criteria

- [ ] All targets met on pilot hardware / staging

### Automation

| Check ID | Type | Description |
|----------|------|-------------|
| P13-PERF | MANUAL | Stopwatch / DevTools Network+LCP notes |
| P13-NOTE | AUTO | Records that performance must be manual |

---

## PHASE 14 – Regression (Import Engine V1)

### Steps

```bash
npm run regression:import-engine-v1
```

### PASS criteria

- [ ] NIA PASS (450 leaves, sum 351522209.41, fingerprint)
- [ ] STREVI PASS
- [ ] OVERALL: PASS

### Automation

| Check ID | Type | Description |
|----------|------|-------------|
| P14-REGRESSION | AUTO | Full Import Engine v1 regression harness |

---

## 3. Automated checklist runner

```bash
npm run pilot:e2e
```

Produces:

| Output | Path |
|--------|------|
| Machine-readable results | `docs/e2e-pilot/E2E_PILOT_RESULTS.json` |
| Human report | `docs/QUANTIX_E2E_PILOT_REPORT.md` |

The runner:

1. Verifies fixtures and critical modules exist (no feature changes)
2. Runs **Import Engine v1 regression** (Phases 2 & 14 automated core)
3. Marks interactive phases as `MANUAL_REQUIRED`
4. Computes a **Production Readiness Score (0–100)** from automated weight + manual pending penalty

---

## 4. Screenshot register (required for sign-off)

Capture and store under `docs/e2e-pilot/screenshots/` (create folder during pilot):

| ID | Phase | Capture |
|----|-------|---------|
| S1 | 1 | Projects list with new pilot project |
| S2 | 2 | Import success + 450 items / direct cost |
| S3 | 3 | WBS tree expanded |
| S4 | 4 | BOQ grid after edit |
| S5 | 5 | Resource create/search |
| S6 | 6 | Estimate Summary totals |
| S7 | 7 | Tender preview / PDF |
| S8 | 8 | Master template version |
| S9 | 9 | New project from template |
| S10 | 10 | Historical archive |
| S11 | 11 | Audit trail entries |
| S12 | 12 | Takeoff + BOQ assignment |
| S13 | 14 | Regression OVERALL PASS terminal |

---

## 5. Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Estimator (pilot) | | | |
| QS / Reviewer | | | |
| Admin / Tech lead | | | |

**Rule:** Do not change Import Engine or add features to “make the pilot pass.” Fix only confirmed **production bugs**, then re-run this checklist.
