# Master Template Import Workflow (Phase 8)

Extends the Smart Excel Import Engine so a BCB workbook becomes a reusable Master Template.

## Capabilities

- BCB detection: Project Info, WBS/BOQ, Resource Breakdown, Rate Analysis
- Auto-create Project Resource Library + link every BOQ item via rate analysis
- Company resource matching with confidence
- Import reconciliation report (Excel vs Quantix within tolerance)
- Save project as Master Template
- Create Project from Master Template (WBS, BOQ, PRL, rate analysis, productivity, assumptions)

## Apply schema

```sql
-- supabase/fixes/smart-excel-import-engine.sql
-- supabase/fixes/master-template-import-workflow.sql
```

## UI

- `/projects/import` — Smart Excel Import
- Project Overview — **Save as Master Template**
- `/templates` — Create Project from Master Template

## Verify

```bash
npm run verify:master-template-import
```
