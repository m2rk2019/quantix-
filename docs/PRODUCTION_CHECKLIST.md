# Production Checklist (Pilot Release)

Use before pilot deployment and production go-live.

## Pre-Deploy

- [ ] Run `npm run deploy:preflight` (env, typecheck, lint, build, rc:verify)
- [ ] Run `npm run verify:uat-suite` (full automated UAT gate — 7 scripts)
- [ ] Apply all Supabase migrations in order (`npm run deploy:migrations`)
- [ ] Configure Vercel env vars (see DEPLOYMENT_GUIDE.md)
- [ ] Do **not** set `SUPABASE_SERVICE_ROLE_KEY` on Vercel production

## Supabase Production

- [ ] Create production Supabase project
- [ ] Run migrations through `20260711120000_benchmark_sprint14.sql`
- [ ] Enable RLS on all tables (included in migrations)
- [ ] Provision first admin: `npm run deploy:provision-user`
- [ ] Configure company settings at `/admin/settings`
- [ ] Optional: apply benchmark seed (`supabase/seed-historical-benchmarks.sql`)

## Vercel

- [ ] Node.js 20.x
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `NEXT_PUBLIC_APP_URL` (production HTTPS URL)
- [ ] Production domain + Supabase redirect URLs aligned

## Security

- [ ] No secrets in source code or git
- [ ] Role-based access verified (estimator vs admin vs viewer)
- [ ] Audit trail active (project + company settings changes)
- [ ] Error boundaries: `app/(shell)/error.tsx`, `app/not-found.tsx`
- [ ] Production env validation via `lib/env/validate.ts`

## Smoke Tests (Production)

- [ ] Login / logout / session refresh
- [ ] Create project (inherits company defaults)
- [ ] WBS + BOQ edit and save
- [ ] Estimate summary refresh + markup edit
- [ ] Excel export with company branding
- [ ] PDF print with company header/footer
- [ ] Executive dashboard loads < 2s
- [ ] AI Estimator generate (no apply required for smoke)
- [ ] Resource library read/write (admin)
- [ ] UAT hub loads at `/admin/uat`

## Pilot Readiness

- [ ] [RELEASE_NOTES_V1.md](./RELEASE_NOTES_V1.md) reviewed
- [ ] [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md) shared with pilot users
- [ ] [PILOT_TEST_GUIDE.md](./PILOT_TEST_GUIDE.md) distributed
- [ ] [ISSUE_REPORT_TEMPLATE.md](./ISSUE_REPORT_TEMPLATE.md) available to pilot users
- [ ] Manual UAT checklist progress tracked in [UAT_CHECKLIST.md](./UAT_CHECKLIST.md)

## Backup & Rollback

- [ ] Enable Supabase daily backups (Pro plan recommended)
- [ ] Document rollback: redeploy previous Vercel build; DB rollback only via Supabase point-in-time recovery
- [ ] Keep migration SQL bundle: `npm run db:combine-migrations`

## Post-Deploy

- [ ] Monitor Vercel function logs (no secret leakage)
- [ ] Confirm Supabase Auth redirect URLs for production domain
- [ ] Pilot coordinator contact details filled in PILOT_TEST_GUIDE.md
