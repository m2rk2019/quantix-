# Historical Projects Repository (Phase 4)

Every completed estimate becomes reusable company knowledge.

## What ships

- **Registry** `historical_projects` — searchable catalog with facets for name, client, location, building type, discipline, resource, supplier, and date.
- **Snapshots** `historical_project_snapshots` — immutable JSON payloads for:
  - Project Information
  - WBS
  - BOQ (+ rate analysis lines)
  - Project Resource Library
  - Estimate Summary
  - AI Outputs (audit events)
  - Executive Reports (KPI snapshot)
- **Flattened indexes** `historical_boq_lines`, `historical_resource_rates` — search today; Historical Cost Intelligence / Benchmarking later.
- **Clone** — deep-copy a historical archive into a new draft project (`project_details.cloned_from_historical_id`).

## Capture triggers

| Event | Behavior |
|-------|----------|
| Project → **Approved** | Capture / refresh active historical archive |
| Project → **Archived** | Refresh archive (version++) |
| Admin **Sync completed projects** | Backfill approved/archived missing archives |

Live project tables are unchanged. Archive is additive knowledge, not a move.

## Apply schema

```sql
-- Supabase SQL editor or migration runner
-- File: supabase/fixes/historical-projects-repository.sql
-- or: supabase/migrations/20261005130000_historical_projects_repository.sql
```

Backward compatible: if tables are missing, lifecycle still succeeds (capture soft-skips).

## UI

- Sidebar → **Historical**
- `/historical` — search + list
- `/historical/[id]` — section inventory + **Clone into new project**

## Future layers (not implemented)

| Flag / table | Purpose |
|--------------|---------|
| `is_benchmark_eligible` | Candidate for estimate-vs-actual benchmarks |
| `cost_intelligence_ready` | Flattened rates/BOQ ready for HCI |
| `historical_resource_rates` | Cross-project rate negotiation / trends |
| `historical_boq_lines` | Unit-rate benchmarking by discipline/item |

Do **not** confuse with Sprint 14 Benchmarks (`project_details.is_benchmark` + `project_benchmark_actuals`), which remains the accuracy-validation admin tool.
