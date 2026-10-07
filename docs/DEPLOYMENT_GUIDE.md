# Production Deployment Guide — Quantix V1

| Field | Value |
|-------|-------|
| **Document** | DEPLOYMENT_GUIDE |
| **Product** | Quantix |
| **Version** | 1.0 |
| **Status** | Pilot Release |
| **Last Updated** | 2026-06-26 |
| **Related** | [ARCHITECTURE_V1.md](./ARCHITECTURE_V1.md) · [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) · [DATABASE_DESIGN_V1.md](./DATABASE_DESIGN_V1.md) · [RELEASE_NOTES_V1.md](./RELEASE_NOTES_V1.md) · [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)

---

## 1. Overview

Quantix V1 is a **browser-first, cloud-hosted** estimating application:

| Layer | Platform |
|-------|----------|
| Frontend / API routes | **Vercel** (Next.js 16 App Router) |
| Authentication | **Supabase Auth** |
| Database | **Supabase PostgreSQL** |

There is no on-premises or desktop deployment path in V1. Production consists of one Vercel project connected to one Supabase production project, with optional staging/preview environments for validation before promotion.

**Recommended environment layout:**

| Environment | Vercel | Supabase | Purpose |
|-------------|--------|----------|---------|
| **Local** | `npm run dev` | Dev project (or local CLI) | Developer workstations |
| **Preview** | Per-PR / branch deploys | Staging project (recommended) | QA and regression |
| **Production** | Production domain | Production project | Live users |

---

## 2. Vercel Deployment

### 2.1 Prerequisites

- Git repository with Quantix `main` branch passing:
  ```bash
  npm run deploy:preflight
  ```
- Vercel account with access to the Git provider (GitHub, GitLab, or Bitbucket)
- Supabase production project created and migrations applied (Section 3)
- Production domain ready (Section 7), or use the default `*.vercel.app` URL initially

### 2.2 Import Project

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard) → **Add New** → **Project**.
2. Import the Quantix repository.
3. Framework preset: **Next.js** (auto-detected).
4. **Root directory:** repository root (where `package.json` lives).
5. **Build command:** `npm run build` (default).
6. **Install command:** `npm install` (default).
7. **Output directory:** leave default (Next.js handles this).
8. **Node.js version:** **20.x** (set under Project → Settings → General → Node.js Version).

### 2.3 Environment Variables

Configure variables for **Production**, **Preview**, and **Development** as appropriate (Section 4). At minimum, production requires the Supabase URL and anon key before the first deploy.

### 2.4 Deploy

| Trigger | Result |
|---------|--------|
| Push / merge to `main` | Production deployment |
| Pull request or feature branch | Preview deployment |

**First production deploy workflow:**

1. Apply all Supabase migrations to the production database (Section 5).
2. Provision administrator and test users (Section 3.4).
3. Set Vercel environment variables (Section 4).
4. Merge to `main` or trigger **Redeploy** from the Vercel dashboard.
5. Run the production checklist (Section 10).
6. Smoke-test on the production URL before announcing go-live.

### 2.5 Vercel Project Settings

| Setting | Recommended value | Notes |
|---------|-------------------|-------|
| Production branch | `main` | Per DEVELOPMENT_GUIDE |
| Preview deployments | Enabled | Connect to staging Supabase, not production |
| Function region | Nearest to users / Supabase region | Reduces latency |
| `vercel.json` | Included in repo | Extends export API timeout (Section 2.6) |

### 2.6 Serverless Function Duration (Excel Export)

The Excel export API route (`/api/projects/[projectId]/export`) may run up to **300 seconds** for large projects (100k+ BOQ rows). The repository includes `vercel.json` to request extended duration on supported Vercel plans.

- **Hobby plan:** default function timeout may be lower; large exports can fail — test on preview and upgrade plan if needed.
- **Pro plan:** supports extended durations per `vercel.json`.

Monitor export duration in Vercel function logs after go-live.

---

## 3. Supabase Production Setup

### 3.1 Create Production Project

1. [Supabase Dashboard](https://supabase.com/dashboard) → **New project**.
2. Choose organization, **region** (closest to primary users), and a strong database password.
3. Store the database password in a team secrets manager — it is required for direct `psql` access and manual backups.
4. Record **Project URL**, **anon public key**, and **service_role key** (Settings → API).

**Important:** Use a **dedicated production project**. Do not point production Vercel at a developer’s personal Supabase project.

### 3.2 Auth Configuration

In Supabase → **Authentication** → **URL Configuration**:

| Setting | Production value |
|---------|------------------|
| **Site URL** | `https://your-production-domain.com` |
| **Redirect URLs** | `https://your-production-domain.com/**`, `https://*.vercel.app/**` (for preview QA) |

Additional Auth settings for V1:

| Setting | Value | Reason |
|---------|-------|--------|
| Email provider | Enabled | V1 uses email/password per SRS |
| Confirm email | Team choice | Disable for internal pilots; enable for external users |
| Sign-ups | **Disabled** | V1 has no self-registration; admins provision users |
| Password policy | Minimum 8+ characters | Align with organizational policy |

### 3.3 Row Level Security

All application tables use RLS policies defined in migrations. After migrations are applied:

1. Supabase → **Database** → **Tables** — confirm RLS is **enabled** on:
   - `users`, `projects`, `project_details`, `wbs`, `boq_items`, `estimate_summary`, `audit_log`
2. Run role-based access smoke tests (Section 10) with accounts for each role.

### 3.4 User Provisioning (V1)

Quantix V1 does **not** include an admin user-management UI. Provision users manually:

1. **Authentication → Users → Add user** — create email/password account.
2. Copy the user’s UUID.
3. **SQL Editor** — insert matching profile (see `supabase/seed.sql`):

```sql
INSERT INTO public.users (id, email, full_name, role)
VALUES (
  'AUTH_USER_UUID_HERE',
  'estimator@yourcompany.com',
  'Jane Estimator',
  'estimator'
);
```

Repeat for each role required at go-live (`super_admin`, `admin`, `estimator`, `quantity_surveyor`, `viewer`).

Optional: use `npm run deploy:provision-user` with `SUPABASE_SERVICE_ROLE_KEY` for scripted provisioning (Section 9).

### 3.5 Database Extensions and Performance

Migrations enable standard PostgreSQL features. For production:

- Review **Database → Indexes** after large data imports.
- Monitor slow queries in Supabase **Reports**.
- Sprint 6.9 adds aggregation RPCs (`sum_boq_total_amount`, `boq_direct_totals_by_wbs`) — ensure migration `20260701120000_performance_sprint69.sql` is applied.

### 3.6 Staging Supabase (Recommended)

Create a second Supabase project for preview/staging:

- Apply the same migrations in the same order.
- Point Vercel **Preview** environment variables at staging credentials.
- Never run destructive tests against production.

---

## 4. Environment Variables

### 4.1 Application Variables

| Variable | Required | Environments | Exposed to browser | Purpose |
|----------|----------|--------------|-------------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | All | Yes | Supabase project API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | All | Yes | Supabase anonymous key (RLS-protected) |
| `NEXT_PUBLIC_APP_URL` | **Recommended** | Production, Preview | Yes | Canonical app URL for metadata (`app/layout.tsx`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Local / CI only | **Never** | User provisioning scripts only — **do not set on Vercel production** |

Copy `.env.example` to `.env.local` for local development:

```bash
cp .env.example .env.local
```

### 4.2 Where to Set Variables

| Platform | Location |
|----------|----------|
| **Local** | `.env.local` (gitignored) |
| **Vercel Production** | Project → Settings → Environment Variables → Production |
| **Vercel Preview** | Same UI → Preview |
| **Vercel Development** | Same UI → Development (for `vercel dev`) |

### 4.3 Example Production Values

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=https://quantix.yourcompany.com
```

### 4.4 Security Rules

- Never commit `.env.local`, service role keys, or database passwords to Git.
- The **anon key** is safe for the browser because **RLS** enforces authorization at the database layer.
- The **service role key** bypasses RLS — restrict to local provisioning scripts and CI secrets vaults only.
- Rotate keys in Supabase Settings → API if exposure is suspected; update Vercel variables and redeploy.

### 4.5 Verify Configuration

```bash
# Local — loads .env.local if present
npm run deploy:check-env

# CI / pre-deploy — pass variables explicitly
DEPLOY_ENV=production npm run deploy:check-env
```

---

## 5. Database Migration Order

Migrations live in `supabase/migrations/`. Apply **in timestamp order** — never skip or reorder.

| # | File | Sprint | Summary |
|---|------|--------|---------|
| 1 | `20260625120000_create_users_auth.sql` | 1 | `users` table, `user_role` enum, RLS, auth helpers |
| 2 | `20260626120000_create_projects.sql` | 2 | `projects`, `project_details`, `estimate_summary`, `audit_log`, project codes |
| 3 | `20260627120000_project_details_sprint3.sql` | 3 | Extended project details fields, estimate settings |
| 4 | `20260628120000_create_wbs.sql` | 4 | `wbs`, `boq_items` schema, read RLS |
| 5 | `20260629120000_boq_sprint5.sql` | 5 | `other_cost_rate`, BOQ write RLS |
| 6 | `20260630120000_audit_trail_sprint68.sql` | 6.8 | `audit_log.project_id`, expanded audit RLS |
| 7 | `20260701120000_performance_sprint69.sql` | 6.9 | Performance indexes, `sum_boq_total_amount` RPC |

### 5.1 Apply Migrations

**Option A — Supabase CLI (recommended for teams):**

```bash
# One-time: link local CLI to production (use access token, not DB password in CI)
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Review pending migrations
npm run deploy:migrations

# Push all pending migrations
supabase db push
```

**Option B — SQL Editor (manual):**

1. Supabase Dashboard → **SQL Editor**.
2. Open each migration file from the repository **in order**.
3. Execute the full contents.
4. Confirm no errors before proceeding to the next file.

**Option C — CI migration job:**

Run `supabase db push` from a protected pipeline using `SUPABASE_ACCESS_TOKEN` and project ref. Restrict to release engineers.

### 5.2 Migration Rules (Production)

Per DEVELOPMENT_GUIDE and DATABASE_DESIGN_V1:

- **Additive only** in V1 — no column drops or renames on live production.
- **Never edit** a migration file after it has been applied to production; create a new timestamped migration instead.
- Take a backup **before** applying new migrations to production (Section 6).
- After schema changes, regenerate `types/database.ts` from Supabase CLI in development and commit if types changed.

### 5.3 Verify Applied Migrations

```bash
npm run deploy:migrations
```

Lists all migration files and instructions. On linked projects:

```bash
supabase migration list
```

Confirm all seven migrations show as applied.

---

## 6. Backup Strategy

### 6.1 Supabase Managed Backups

| Plan | Capability |
|------|------------|
| **Free** | Limited — not suitable for production business data |
| **Pro** | Daily automated backups, **Point-in-Time Recovery (PITR)** on higher tiers |

**Production recommendation:** Supabase **Pro** (or higher) with PITR enabled for the production project.

### 6.2 Pre-Deploy and Pre-Migration Backups

Before major releases or schema migrations:

1. Supabase Dashboard → **Database** → **Backups** → confirm latest backup timestamp.
2. For critical releases, run a manual logical export:
   ```bash
   # Requires database connection string from Supabase Settings → Database
   pg_dump "$DATABASE_URL" --format=custom --file=quantix-backup-$(date +%Y%m%d).dump
   ```
3. Store dumps in encrypted object storage (S3, Azure Blob, etc.) with retention policy (e.g. 30–90 days).

### 6.3 Application-Level Data

| Data | Backup approach |
|------|-----------------|
| **PostgreSQL (all business data)** | Supabase backups + optional `pg_dump` |
| **Audit trail** | Included in DB backups; export periodically for compliance archives |
| **Auth users** | Included in Supabase Auth; export user list from dashboard before bulk changes |
| **Excel exports** | Generated on demand — not stored server-side |

### 6.4 Recovery Objectives (V1 Guidance)

| Metric | Target |
|--------|--------|
| **RPO** (max data loss) | ≤ 24 hours on Pro daily backups; minutes with PITR |
| **RTO** (time to restore service) | ≤ 4 hours for full restore + verification |

Document actual targets in your organization’s runbook.

### 6.5 Restore Procedure (Database)

1. Supabase Dashboard → **Database** → **Backups** → select restore point.
2. Or contact Supabase support for PITR restore to a new project.
3. Update Vercel `NEXT_PUBLIC_SUPABASE_*` variables if project ref changes.
4. Run smoke tests (Section 10).
5. Record incident in internal postmortem.

---

## 7. SSL / TLS

Quantix V1 relies on platform-managed TLS — no custom certificate installation is required.

| Endpoint | TLS provider | Notes |
|----------|--------------|-------|
| Vercel app (`*.vercel.app` or custom domain) | Vercel | Automatic HTTPS; HTTP redirects to HTTPS |
| Supabase API (`*.supabase.co`) | Supabase | All API and Auth traffic over HTTPS |
| Browser → Vercel → Supabase | End-to-end HTTPS | No mixed-content assets |

**Custom domain SSL:** When a domain is added in Vercel (Section 8), certificates are issued automatically via Let’s Encrypt. Allow up to 24 hours for DNS propagation and certificate provisioning.

**Enforcement checklist:**

- [ ] Production `NEXT_PUBLIC_APP_URL` uses `https://`
- [ ] Supabase Auth Site URL uses `https://`
- [ ] No hard-coded `http://` URLs in environment variables

---

## 8. Domain Configuration

### 8.1 Add Custom Domain in Vercel

1. Vercel Project → **Settings** → **Domains** → **Add**.
2. Enter production hostname (e.g. `quantix.yourcompany.com`).
3. Follow Vercel’s DNS instructions:

| Record type | Typical configuration |
|-------------|----------------------|
| **A** | Point apex domain to Vercel IP (if using apex) |
| **CNAME** | `quantix` → `cname.vercel-dns.com` (subdomain) |

4. Wait for **Valid Configuration** and certificate issuance.

### 8.2 Update Application Configuration

1. Set Vercel production variable:
   ```env
   NEXT_PUBLIC_APP_URL=https://quantix.yourcompany.com
   ```
2. Redeploy production after changing environment variables.
3. Update Supabase Auth **Site URL** and **Redirect URLs** (Section 3.2).

### 8.3 Preview Domains

Vercel preview URLs (`*.vercel.app`) work without custom DNS. Add `https://*.vercel.app/**` to Supabase redirect URLs for PR testing.

### 8.4 Optional: WWW Redirect

Configure `www` → apex (or apex → `www`) in Vercel Domains settings for a single canonical hostname. Match `NEXT_PUBLIC_APP_URL` to the canonical choice.

---

## 9. Monitoring

### 9.1 Vercel

| Tool | Purpose |
|------|---------|
| **Deployments** | Build success/failure, deployment history |
| **Functions / Logs** | Server errors, export route duration, 5xx responses |
| **Analytics** (optional add-on) | Traffic, Web Vitals |
| **Speed Insights** (optional) | Real-user performance |

**Alerts to configure:**

- Deployment failure notifications (email / Slack integration).
- Elevated 5xx rate on production (Vercel integrations or external APM).

### 9.2 Supabase

| Tool | Purpose |
|------|---------|
| **Database → Reports** | CPU, memory, connections, disk |
| **Auth logs** | Failed logins, unusual activity |
| **API logs** | Request volume and errors |
| **Advisors** | Missing indexes, security suggestions |

**Thresholds to watch:**

- Database connections approaching plan limit.
- Disk usage > 80%.
- Sustained API error rate after releases.

### 9.3 External Uptime Monitoring

Use a third-party service (UptimeRobot, Better Stack, Pingdom) to poll:

- `https://your-domain.com/login` — expect HTTP 200.
- Frequency: 1–5 minutes.
- Alert on 2+ consecutive failures.

### 9.4 Application Health Indicators

| Signal | Healthy | Investigate |
|--------|---------|-------------|
| Login page loads | < 3s | CDN, build, or env misconfiguration |
| Dashboard project count | Matches DB | RLS or cache invalidation issue |
| Excel export (large project) | Completes < 300s | Function timeout or plan limits |
| Validation panel | Loads on summary | Migration or RPC missing |

### 9.5 V1 Scope Limitations

Quantix V1 does not ship custom APM, error tracking (Sentry), or log aggregation. Add these in V1.5+ if operational requirements demand them.

---

## 10. Logging

### 10.1 Vercel Runtime Logs

- **Server Components / Server Actions:** Logged in Vercel → Project → **Logs**.
- **API routes** (e.g. `/api/projects/[projectId]/export`): Function invocation logs include duration and status.
- **Retention:** Plan-dependent; export critical logs to external storage for long-term retention if required.

### 10.2 Supabase Logs

| Log type | Location | Use |
|----------|----------|-----|
| Postgres | Logs → Postgres | Slow queries, errors |
| Auth | Logs → Auth | Login failures |
| API | Logs → API | REST/GraphQL edge errors |

### 10.3 Application Audit Trail

Business events are persisted in `audit_log` (Sprint 6.8):

- Project lifecycle, BOQ/WBS changes, estimate exports (`project.exported`).
- Viewable in-app at `/projects/[projectId]/audit`.
- Query directly for compliance reporting:

```sql
SELECT created_at, action, actor_id, payload
FROM audit_log
WHERE project_id = 'PROJECT_UUID'
ORDER BY created_at DESC
LIMIT 100;
```

### 10.4 What Not to Log

- Passwords, session tokens, or service role keys.
- Full Excel file contents in logs.
- PII beyond what audit requirements mandate — follow organizational policy.

---

## 11. Production Checklist

Complete this checklist before go-live and after each production release.

### 11.1 Code and Build

- [ ] `npm run deploy:preflight` passes (typecheck, lint, build, RC verify)
- [ ] No secrets in repository or build output
- [ ] Release tagged in Git (e.g. `v1.0.0`)

### 11.2 Supabase Production

- [ ] All 7 migrations applied in order (Section 5)
- [ ] RLS enabled on all application tables
- [ ] Auth Site URL and Redirect URLs configured
- [ ] Sign-ups disabled; admin users provisioned
- [ ] Backups / PITR enabled per organizational policy
- [ ] Database password stored in secrets manager

### 11.3 Vercel Production

- [ ] `NEXT_PUBLIC_SUPABASE_URL` set (Production)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set (Production)
- [ ] `NEXT_PUBLIC_APP_URL` set to production HTTPS URL
- [ ] `SUPABASE_SERVICE_ROLE_KEY` **not** set on Vercel production
- [ ] Node.js 20 selected
- [ ] Custom domain configured and SSL valid (if applicable)
- [ ] Production deployment status: **Ready**

### 11.4 Functional Smoke Test (Production)

Perform as `super_admin` and one non-admin role:

- [ ] Login / logout
- [ ] Dashboard loads project metrics
- [ ] Create project → WBS → BOQ → Estimate Summary
- [ ] Validation panel shows checks; export blocked when errors exist
- [ ] Excel export downloads valid `.xlsx` when validation passes
- [ ] Audit History shows recent actions including export
- [ ] Viewer cannot access `/projects/new` (redirects to `/unauthorized`)
- [ ] Lifecycle transitions (draft → in progress → for review → approved)

### 11.5 Security and Compliance

- [ ] Role matrix verified (see RELEASE_CHECKLIST.md Section 3)
- [ ] Cross-browser spot check: Chrome, Edge, Firefox (latest 2 versions)
- [ ] Responsive check: desktop (1280px), tablet (768px), mobile (375px)

### 11.6 Post-Deploy

- [ ] Monitor Vercel logs for 24 hours after release
- [ ] Monitor Supabase dashboard metrics
- [ ] Confirm backup job succeeded (next scheduled window)
- [ ] Update RELEASE_CHECKLIST.md sign-off if applicable

---

## 12. Rollback Procedure

### 12.1 Application Rollback (Vercel) — Fastest

Use when a **frontend/API regression** is detected and the database schema has **not** changed.

1. Vercel → Project → **Deployments**.
2. Locate the last known-good production deployment.
3. Click **⋯** → **Promote to Production** (instant rollback).
4. Verify smoke tests (Section 11.4).
5. Open incident ticket; fix forward on a hotfix branch.

**Typical recovery time:** < 5 minutes.

### 12.2 Environment Variable Rollback

If a bad variable was introduced:

1. Vercel → Settings → Environment Variables → restore previous values.
2. **Redeploy** production (Deployments → Redeploy).
3. Verify login and data access.

### 12.3 Database Rollback

V1 migrations are **additive**. Rolling back application code does not require reversing schema changes in most releases.

| Scenario | Action |
|----------|--------|
| Bad migration applied | Restore database from pre-migration backup or PITR (Section 6.5) |
| Bad data introduced | Targeted SQL fix or restore; use audit_log to assess impact |
| RPC / function error | Redeploy previous app version; fix migration in new forward migration |

**Never** run ad-hoc `DROP TABLE` on production without explicit approval and backup.

### 12.4 Rollback Decision Matrix

| Symptom | Roll back Vercel? | Roll back DB? |
|---------|-------------------|---------------|
| UI bug, calculations wrong in app only | Yes | No |
| Export timeout | Yes (or scale plan) | No |
| RLS policy blocks all reads | Maybe | Maybe — fix policy via new migration preferred |
| Migration corrupted data | No (fix forward or restore DB) | Yes — restore from backup |
| Supabase outage | No | Wait / status page |

### 12.5 Communication

During rollback:

1. Notify stakeholders of degraded service and ETA.
2. Record timeline, root cause, and preventive actions.
3. After recovery, run full smoke test before closing incident.

---

## 13. Deployment Scripts

Scripts in `scripts/` support repeatable deployment preparation. NPM aliases:

| Command | Purpose |
|---------|---------|
| `npm run deploy:check-env` | Validate required environment variables |
| `npm run deploy:migrations` | List migration files in apply order |
| `npm run deploy:preflight` | Full pre-deploy gate (env + typecheck + lint + build + RC verify) |
| `npm run deploy:provision-user` | Provision auth user + `public.users` profile (local/ops; requires service role key) |

### 13.1 Pre-Deploy (Local or CI)

```bash
npm run deploy:preflight
```

### 13.2 Production Release Sequence

```bash
# 1. Verify local / CI build
npm run deploy:preflight

# 2. Apply database migrations (Supabase CLI)
supabase link --project-ref YOUR_PROD_REF
supabase db push

# 3. Provision users (if needed)
npm run deploy:provision-user -- --email admin@company.com --name "Admin" --role super_admin --password '...'

# 4. Set Vercel env vars in dashboard, then merge to main or redeploy

# 5. Smoke test production URL
```

---

## 14. Related Documents

| Document | Relevance |
|----------|-----------|
| [RELEASE_CHECKLIST.md](../RELEASE_CHECKLIST.md) | RC feature matrix and sign-off |
| [AUTHORIZATION_V1.md](./AUTHORIZATION_V1.md) | Role permissions for smoke tests |
| [PROJECT_LIFECYCLE_V1.md](./PROJECT_LIFECYCLE_V1.md) | Status transitions to verify |
| [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) §11 | Original deployment overview |

---

## 15. Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Technical Lead | | | |
| DevOps / Platform | | | |
| Product Owner | | | |

---

## 11. Sprint 13 Additions

### Company Settings Migration

Apply `20260710120000_company_settings_sprint13.sql` after prior migrations. Seeds a singleton `company_settings` row and adds production performance indexes.

### Post-Migration Setup

1. Sign in as admin → **Company Settings** (`/admin/settings`)
2. Configure company name, logo, defaults, and report branding
3. Run verification:
   ```bash
   npm run verify:company-settings
   npm run verify:executive-dashboard
   ```

### Additional Documentation

- [COMPANY_SETTINGS.md](./COMPANY_SETTINGS.md)
- [PERFORMANCE_GUIDE.md](./PERFORMANCE_GUIDE.md)
- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)

---

*End of Document*
