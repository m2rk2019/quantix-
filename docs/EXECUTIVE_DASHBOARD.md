# Executive Dashboard & Analytics (Sprint 11)

Quantix V1 executive dashboard at `/dashboard` — portfolio KPIs, cost analytics, AI insights, and one-click reports.

## Features

### Dashboard Overview
- Total / Active / Completed / Draft projects
- Total estimated value, average markup, average profit, average cost per project

### Cost Analytics
- Cost breakdown (material, labor, equipment, subcontract, OCM, contingency, profit, VAT)
- Cost by discipline, WBS distribution, top 20 cost items, resource usage

### Project Status
Executive lifecycle buckets: Draft, Estimating, Review, Submitted, Awarded, Archived

### AI Insights
- Highest cost discipline, missing scope, duplicate BOQ, high-risk estimates, cost saving opportunities, AI confidence score

### Search & Filters
Project search, client, location, estimator, date range, status — with server-side pagination

### Executive Reports
One-click Excel export (`/api/dashboard/export`) and PDF via print (`/dashboard/print`):
- Executive Summary, Project Cost, Resource, Discipline, Risk, AI Recommendation

## Architecture

| Layer | Path |
|-------|------|
| Types | `types/dashboard.ts` |
| Aggregations | `lib/dashboard/aggregations.ts` |
| Insights | `lib/dashboard/insights.ts` |
| Service | `services/dashboard/get-executive-dashboard.ts` |
| Export | `services/dashboard/export-executive-report.ts` |
| UI | `features/dashboard/components/` |

## Performance

- Parallel Supabase queries (projects, BOQ, counts, audit)
- Lazy-loaded chart panel (`dynamic` import)
- Server-side pagination for project table
- No per-project estimate sync on dashboard load

## Verification

```bash
npm run verify:executive-dashboard
npm run verify:estimating-engine
npm run lint
npm run build
```

## Notes

- RLS scopes portfolio data by role (estimators see own projects; QS/admin see org-wide)
- Mixed-currency portfolios show a warning; totals sum without FX conversion
- PDF export uses browser print (Save as PDF), consistent with project estimate export
