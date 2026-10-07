# Quantix

Cloud-based construction estimating platform — **Version 1.0 Pilot Release**.

## Pilot Release

Quantix V1 is ready for controlled pilot deployment. Start here:

| Document | Purpose |
|----------|---------|
| [RELEASE_NOTES_V1.md](./docs/RELEASE_NOTES_V1.md) | Completed modules and verification status |
| [PILOT_TEST_GUIDE.md](./docs/PILOT_TEST_GUIDE.md) | How pilot users test and report issues |
| [DEMO_PROJECT_DESCRIPTION.md](./docs/DEMO_PROJECT_DESCRIPTION.md) | Megawide Office Building pilot demo dataset |
| [QUANTIX_V1_USER_GUIDE.md](./docs/QUANTIX_V1_USER_GUIDE.md) | Complete step-by-step user guide (login to export) |
| [KNOWN_LIMITATIONS.md](./docs/KNOWN_LIMITATIONS.md) | Current limits and future enhancements |
| [ISSUE_REPORT_TEMPLATE.md](./docs/ISSUE_REPORT_TEMPLATE.md) | Structured bug report template |
| [PRODUCTION_CHECKLIST.md](./docs/PRODUCTION_CHECKLIST.md) | Pre-deploy checklist |
| [DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) | Vercel + Supabase deployment |

## Documentation

See the [docs/](./docs/) folder for specifications and runbooks:

- [SRS_QUANTIX_V1.md](./docs/SRS_QUANTIX_V1.md) · [ARCHITECTURE_V1.md](./docs/ARCHITECTURE_V1.md)
- [DATABASE_DESIGN_V1.md](./docs/DATABASE_DESIGN_V1.md) · [UI_SPEC_V1.md](./docs/UI_SPEC_V1.md)
- [DEVELOPMENT_GUIDE.md](./docs/DEVELOPMENT_GUIDE.md)
- [UAT_CHECKLIST.md](./docs/UAT_CHECKLIST.md) · [UAT_RESULTS.md](./docs/UAT_RESULTS.md)
- [FORMULA_VALIDATION.md](./docs/FORMULA_VALIDATION.md) · [HISTORICAL_BENCHMARK.md](./docs/HISTORICAL_BENCHMARK.md)
- [COMPANY_SETTINGS.md](./docs/COMPANY_SETTINGS.md) · [EXECUTIVE_DASHBOARD.md](./docs/EXECUTIVE_DASHBOARD.md)
- [AI_ENGINEERING_KNOWLEDGE.md](./docs/AI_ENGINEERING_KNOWLEDGE.md)
- [PRODUCT_ROADMAP.md](./docs/PRODUCT_ROADMAP.md)

## Getting Started

1. Copy `.env.example` to `.env.local` and set your Supabase project URL and anon key.
2. Apply database migrations in `supabase/migrations/` via the Supabase SQL editor or CLI (`npm run deploy:migrations`).
3. Create auth users in Supabase Dashboard → Authentication, then insert matching rows in `public.users` (see `supabase/seed.sql`).
4. Install dependencies: `npm install`
5. Run development server: `npm run dev`
6. Open [http://localhost:3000](http://localhost:3000)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript compiler |
| `npm run deploy:preflight` | Pre-deploy gate (env, typecheck, lint, build, rc:verify) |
| `npm run verify:uat-suite` | Full automated UAT gate (7 verify scripts) |
| `npm run verify:estimating-engine` | Formula and performance validation |
| `npm run verify:historical-benchmarks` | Benchmark accuracy validation |
| `npm run deploy:migrations` | List Supabase migrations in apply order |
| `npm run deploy:check-env` | Validate environment variables |
| `npm run demo:generate` | Regenerate demo office building SQL |
| `npm run demo:historical-benchmarks` | Regenerate benchmark seed SQL |
| `npm run load:demo` | Load Megawide Office Building pilot demo |
| `npm run reset:demo` | Reset pilot demo data |
| `npm run verify:megawide-office` | Verify pilot demo totals and consistency |

## Demo & Seed Data

| Seed file | Purpose |
|-----------|---------|
| `supabase/seed.sql` | Base user profiles |
| `supabase/seed-megawide-office-building.sql` | **Local pilot demo** (600 BOQ, ~₱450M) — see [DEMO_PROJECT_DESCRIPTION.md](./docs/DEMO_PROJECT_DESCRIPTION.md) |
| `supabase/seed-demo-office-building.sql` | Large demo (150 WBS, 2000 BOQ) — see [DEMO_PROJECT.md](./docs/DEMO_PROJECT.md) |
| `supabase/seed-formula-validation-demo.sql` | Formula validation project (100 BOQ) |
| `supabase/seed-historical-benchmarks.sql` | Five benchmark archetypes |

## Production Deployment

See [docs/DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) for Vercel setup, Supabase production configuration, environment variables, backups, monitoring, and rollback procedures.

**Pre-pilot gate:**

```bash
npm run deploy:preflight
npm run verify:uat-suite
```

## Admin Routes

| Route | Access | Purpose |
|-------|--------|---------|
| `/admin/demo` | Admin+ | Load / reset Megawide pilot demo |
| `/admin/settings` | Admin+ | Company branding and defaults |
| `/admin/benchmarks` | Admin+ | Historical estimate validation |
| `/admin/uat` | Admin+ | UAT checklist, formula verification, performance |
| `/admin/resource-library` | All (write: Admin+) | Rate library |

## License

Proprietary — internal pilot use.
