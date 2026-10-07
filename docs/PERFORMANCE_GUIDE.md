# Performance Guide (Sprint 13)

Quantix V1 performance targets and optimization patterns.

## Targets

| Surface | Target |
|---------|--------|
| Executive Dashboard | < 2s |
| Projects list | < 1s |
| WBS tree | < 1s |
| BOQ (5,000 rows) | < 3s |
| Search | < 200ms perceived |
| Save | < 500ms |

## Database

Migration `20260710120000_company_settings_sprint13.sql` adds indexes:

- `projects_list_updated_idx`, `projects_status_updated_idx`, `projects_client_name_idx`
- `boq_items_project_amount_idx`, `boq_items_project_description_idx`
- `estimate_summary_project_idx`, `audit_log_action_created_idx`
- `wbs_project_level_sort_idx`

Existing Sprint 6.9 indexes: `boq_items_project_sort_idx`, aggregation RPCs.

## Pagination

| Module | Page size | Pattern |
|--------|-----------|---------|
| BOQ | 200 | Infinite scroll + server `.range()` |
| Projects | 25 | URL pagination |
| Resource library | 50 | Server pagination |
| Dashboard projects | 10 | Server slice |
| Excel export BOQ | 1000 | Async generator stream |

## Client Optimizations

- **Debounced search:** BOQ/WBS 300ms, Projects/Dashboard 200ms
- **Debounced save:** BOQ 500ms
- **Lazy loading:** Dashboard charts via `dynamic()` import
- **BOQ infinite scroll:** Loads pages on scroll (virtual window)

Constants: `lib/performance/constants.ts`

## Caching

- Company settings: `unstable_cache` 60s, tag `company-settings`
- Project summary/WBS: `revalidateTag` on mutations
- Dashboard: parallel queries, no per-project estimate sync

## Query Patterns

- Avoid N+1: batch `estimate_summary` + `project_details` for dashboard
- BOQ analytics: single query + batch WBS lookup
- Use RPCs: `boq_category_totals`, `boq_direct_totals_by_wbs`, `sum_boq_total_amount`

## Verification

```bash
npm run verify:estimating-engine   # formula + perf benchmarks
npm run verify:executive-dashboard
npm run verify:company-settings
```
