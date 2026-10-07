# Historical Estimate Benchmark (Sprint 14)

Validate Quantix V1 against completed construction projects using estimated vs actual comparison.

## Features

### Demo Data Import (`/admin/benchmarks` → Data Import)
- Excel (.xlsx) with sheets: Metadata, WBS, BOQ, Summary
- CSV with sections: `--- metadata ---`, `--- wbs ---`, `--- boq ---`
- Optional actual quantity, actual rate, awarded cost columns for benchmark actuals

### Validation Center
- Per-project comparison: quantity, rate, cost variance
- Automatic findings (overruns, savings, patterns)
- Project route: `/projects/[id]/validation`

### Formula Audit
- Quantity formula, rate formula, resource breakdown
- OCM, contingency, profit, VAT drill-down per BOQ line

### Accuracy Dashboard
- Overall, quantity, rate, cost, formula accuracy
- Variance heatmap, largest overruns/savings, lessons learned

## Acceptance Criteria

| Metric | Target |
|--------|--------|
| Quantity Accuracy | ≥ 95% |
| Rate Accuracy | ≥ 95% |
| Formula Accuracy | ≥ 97% |
| Calculation Consistency | 100% |

## Five Benchmark Projects

| Code | Archetype |
|------|-----------|
| QTX-BENCH-OFF-001 | Office Building |
| QTX-BENCH-CON-001 | Condominium |
| QTX-BENCH-WHS-001 | Warehouse |
| QTX-BENCH-COM-001 | Commercial Building |
| QTX-BENCH-INF-001 | Infrastructure |

## Setup

```bash
npm run demo:historical-benchmarks
# Apply supabase/seed-historical-benchmarks.sql to your database
```

## Verification

```bash
npm run verify:historical-benchmarks
npm run verify:estimating-engine
npm run lint
npm run build
```

## Reports

Excel export via `/api/benchmark/export?report=...`:
- formula_audit, validation, executive_accuracy, lessons_learned

## Architecture

| Layer | Path |
|-------|------|
| Migration | `supabase/migrations/20260711120000_benchmark_sprint14.sql` |
| Types | `types/benchmark.ts` |
| Comparison | `lib/benchmark/comparison.ts` |
| Formula audit | `lib/estimate/formula-audit.ts` |
| Import | `lib/benchmark/import-parsers.ts` |
| Services | `services/benchmark/` |
| UI | `features/benchmark/components/` |
| Seeds | `scripts/lib/historical-benchmark/archetypes.mjs` |
