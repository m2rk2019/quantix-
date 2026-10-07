# Development Guide — Quantix Version 1

| Field | Value |
|-------|-------|
| **Document** | DEVELOPMENT_GUIDE |
| **Product** | Quantix |
| **Version** | 1.0 |
| **Status** | Pilot Release |
| **Last Updated** | 2026-06-26 |
| **Related** | [SRS_QUANTIX_V1.md](./SRS_QUANTIX_V1.md) · [ARCHITECTURE_V1.md](./ARCHITECTURE_V1.md) · [DATABASE_DESIGN_V1.md](./DATABASE_DESIGN_V1.md) · [UI_SPEC_V1.md](./UI_SPEC_V1.md) |

---

## 1. Purpose

This guide defines how Quantix V1 is built, organized, and shipped. It is the single reference for developers working sprint-by-sprint from project scaffold through production release.

**Stack (V1):** Next.js (App Router) on Vercel · Supabase Auth · Supabase PostgreSQL · TypeScript · ESLint · Prettier

**Scope:** V1 pilot — Login, Dashboard, Projects, WBS, BOQ, Rate Library, Rate Analysis, Estimate Summary, Validation, Audit, Excel/PDF Export, AI Estimator, Executive Dashboard, Company Settings, Historical Benchmark, UAT Suite.

**Pilot docs:** [RELEASE_NOTES_V1.md](./RELEASE_NOTES_V1.md) · [PILOT_TEST_GUIDE.md](./PILOT_TEST_GUIDE.md) · [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md)

---

## 2. Development Rules

These rules are mandatory for every sprint. No exceptions without explicit Product Owner approval.

| # | Rule |
|---|------|
| 1 | **Build one sprint at a time.** Complete the current sprint's exit criteria before starting the next. |
| 2 | **Every sprint must compile successfully** before proceeding to the next sprint. |
| 3 | **Fix all TypeScript and ESLint errors** before starting the next sprint. Warnings should be addressed or explicitly suppressed with justification. |
| 4 | **Do not add Version 2 features.** No AI, Procurement, Contracts, Cash Flow, PlanSwift, advanced reports, or speculative abstractions. |
| 5 | **Reuse components whenever possible.** Check `components/` and `features/` before creating anything new. |
| 6 | **Prefer Server Components.** Default to React Server Components for data fetching and static layout. |
| 7 | **Use Client Components only when necessary.** Interactivity, browser APIs, and local state require `"use client"`. |
| 8 | **Follow the Design System and UI Specification.** All visual and interaction decisions defer to [UI_SPEC_V1.md](./UI_SPEC_V1.md). |
| 9 | **Database changes must remain backward compatible.** Additive migrations only; no breaking column renames or drops in V1. |
| 10 | **Keep commits small and focused.** One logical change per commit; easy to review and revert. |

### 2.1 Server vs Client Component Guidance

| Use Server Component | Use Client Component |
|---------------------|---------------------|
| Page layouts and shells | Forms with client-side validation |
| Data fetching from Supabase (read) | Inline BOQ table editing |
| Static project metadata display | WBS tree expand/collapse |
| Route-level auth checks | Toast notifications |
| Breadcrumb rendering | Modal/dialog open/close state |
| Dashboard statistics (server-fetched) | Excel export (browser download) |
| Role-based visibility (server-side) | Password show/hide toggle |

**Rule of thumb:** Push `"use client"` to the smallest leaf component that needs it. Never mark an entire page as client unless the whole page is interactive.

### 2.2 Version 2 Guardrails

If a feature is listed in SRS Section 6 (Out of Scope) or ARCHITECTURE Section 10, do not implement it — even if it seems small. Common temptations to reject:

- Drag-and-drop WBS reordering (reserved in UI spec, not V1)
- User self-registration or SSO
- Import from Excel
- Real-time collaboration
- Admin user management UI
- Percentage-based overhead input (store absolute amounts per database design unless sprint scope explicitly adds UI conversion)

---

## 3. Code Standards

### 3.1 TypeScript

- **Strict mode enabled** (`"strict": true` in `tsconfig.json`)
- No `any` — use `unknown` and narrow, or define proper types in `types/`
- Prefer `interface` for object shapes; `type` for unions and utility types
- Explicit return types on exported functions and service methods
- Use Supabase-generated types (from `types/database.ts`) for database rows — do not hand-roll duplicate DB types

### 3.2 ESLint

- ESLint runs on every save (editor) and in CI
- Zero errors policy at sprint completion
- Use `eslint-config-next` as the base
- No disabling rules file-wide (`/* eslint-disable */`); line-level disable requires a comment explaining why

### 3.3 Prettier

- Prettier is the single source of formatting truth
- Run on save and in pre-commit hook
- Do not hand-format to override Prettier
- Settings: 2-space indent, single quotes, trailing commas (es5), semicolons

### 3.4 Naming Conventions

| Entity | Convention | Example |
|--------|-----------|---------|
| Files (components) | PascalCase | `ProjectCard.tsx` |
| Files (utilities) | kebab-case or camelCase | `format-currency.ts` |
| Files (hooks) | camelCase with `use` prefix | `useProjects.ts` |
| React components | PascalCase | `BoqTable` |
| Functions / variables | camelCase | `fetchProjects`, `grandTotal` |
| Constants | UPPER_SNAKE_CASE | `MAX_BOQ_ITEMS` |
| Types / interfaces | PascalCase | `Project`, `BoqItem` |
| Database tables | snake_case (Supabase convention) | `boq_items`, `project_details` |
| CSS tokens | kebab-case | `--color-primary` |
| Routes (App Router) | kebab-case folders | `app/projects/[id]/wbs/` |
| Git branches | type/description | `feature/sprint-3-create-project` |

### 3.5 Component Standards

- **Small and reusable** — one component, one responsibility; target < 150 lines
- **No duplicated code** — extract shared logic to `hooks/`, `lib/`, or `services/`
- **Props typed explicitly** — no implicit `any` props
- **Composition over configuration** — prefer children and slots over excessive prop drilling
- **Co-locate feature components** in `features/{module}/` when not shared globally

### 3.6 Import Order

1. React / Next.js
2. Third-party libraries
3. `@/components/`
4. `@/features/`
5. `@/hooks/`
6. `@/services/`
7. `@/lib/`
8. `@/types/`
9. Relative imports

Blank line between each group.

---

## 4. Folder Ownership

Each top-level directory has a single clear responsibility. Do not place files outside their owner's scope.

### 4.1 `app/`

**Owner:** Routing, layouts, and page-level composition.

| Contains | Does not contain |
|----------|-----------------|
| Route segments (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`) | Business logic |
| Route-level metadata and auth guards | Reusable UI components |
| Server-side data fetching at page boundary | Direct Supabase client configuration |
| Route groups `(auth)`, `(dashboard)` | Utility functions |

**Examples:**
```
app/
├── (auth)/
│   └── login/page.tsx
├── (dashboard)/
│   ├── layout.tsx          # App shell: sidebar + header
│   ├── dashboard/page.tsx
│   └── projects/
│       ├── page.tsx
│       ├── new/page.tsx
│       └── [id]/
│           ├── page.tsx
│           ├── wbs/page.tsx
│           ├── boq/page.tsx
│           └── estimate/page.tsx
├── layout.tsx              # Root layout
└── globals.css             # Design tokens
```

Pages import from `features/` and `components/`; they do not implement UI inline beyond simple composition.

---

### 4.2 `components/`

**Owner:** Shared, domain-agnostic UI building blocks.

| Contains | Does not contain |
|----------|-----------------|
| Design system primitives (Button, Input, Table, Card, Badge, Toast) | Feature-specific business logic |
| Layout components (Sidebar, Header, Breadcrumb) | Supabase queries |
| Generic patterns (EmptyState, LoadingSpinner, Skeleton) | Route definitions |

**Rule:** If a component is used by more than one feature module, it belongs here. If it is specific to one module (e.g. `WbsTree`), it belongs in `features/wbs/`.

---

### 4.3 `features/`

**Owner:** Domain-specific UI and logic grouped by V1 module.

| Contains | Does not contain |
|----------|-----------------|
| Module screens and composed views | Generic design system primitives |
| Feature-specific sub-components | Route definitions |
| Feature-level hooks (e.g. `useBoqEditor`) | Global utilities |
| Feature constants and helpers scoped to one module | Cross-feature shared services |

**Structure:**
```
features/
├── auth/
├── dashboard/
├── projects/
├── project-details/
├── wbs/
├── boq/
├── estimate/
└── export/
```

Each feature folder is self-contained for its sprint module. Cross-feature imports go through `services/` or `types/`, not direct feature-to-feature imports.

---

### 4.4 `services/`

**Owner:** Data access and business operations.

| Contains | Does not contain |
|----------|-----------------|
| Supabase query functions (`getProjects`, `createBoqItem`) | React components or hooks |
| Business calculations (`calculateBoqTotals`, `rollupWbs`) | UI formatting |
| Server Actions (if used for mutations) | Route handlers unrelated to data |
| Export logic orchestration | Design tokens |

**Rule:** All Supabase calls go through `services/`. Components and pages never import `@supabase/supabase-js` directly.

---

### 4.5 `lib/`

**Owner:** Framework configuration and pure utilities.

| Contains | Does not contain |
|----------|-----------------|
| Supabase client factories (`createClient` server/browser) | Business logic |
| Auth helpers (`getSession`, `requireAuth`) | React components |
| Formatting utilities (`formatCurrency`, `formatDate`) | Database queries |
| Constants (routes, config) | Feature-specific code |
| Validation schemas (Zod) shared across features | |

---

### 4.6 `hooks/`

**Owner:** Shared React hooks used across multiple features.

| Contains | Does not contain |
|----------|-----------------|
| `useToast`, `useDebounce`, `useMediaQuery` | Feature-specific hooks (those live in `features/`) |
| `useAuth` (session state for client components) | Data fetching (prefer Server Components + services) |
| Generic UI state hooks | Business calculations |

---

### 4.7 `types/`

**Owner:** Shared TypeScript type definitions.

| Contains | Does not contain |
|----------|-----------------|
| Domain types (`Project`, `WbsNode`, `BoqItem`, `EstimateSummary`) | Component prop types (co-locate with component) |
| Supabase generated types (`database.ts`) | Runtime code |
| Enums and unions (`ProjectStatus`, `UserRole`) | Zod schemas (those live in `lib/validation/`) |
| API response shapes | |

---

### 4.8 `supabase/`

**Owner:** Database schema, migrations, and Supabase project configuration.

| Contains | Does not contain |
|----------|-----------------|
| SQL migration files (timestamped, ordered) | Application TypeScript |
| Seed data scripts | React components |
| RLS policy definitions | Business logic |
| `config.toml` (local Supabase CLI) | |

**Migration rules:**
- One migration per logical change
- Migrations are additive and backward compatible
- Name format: `{timestamp}_{description}.sql` (e.g. `20260625120000_create_projects.sql`)
- Never edit a migration that has been applied to a shared environment — create a new migration instead

---

### 4.9 `docs/`

**Owner:** Project documentation only.

| Contains | Does not contain |
|----------|-----------------|
| SRS, Architecture, Database Design, UI Spec, Development Guide | Generated code |
| Sprint notes and decision records (optional) | Secrets or environment values |
| README pointers | |

Documentation changes use the `docs/*` branch prefix and `docs:` commit prefix.

---

## 5. Git Workflow

### 5.1 Branch Naming

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feature/*` | New functionality for a sprint | `feature/sprint-4-wbs-tree` |
| `fix/*` | Bug fixes | `fix/boq-total-rounding` |
| `docs/*` | Documentation only | `docs/development-guide` |
| `refactor/*` | Code restructuring, no behavior change | `refactor/extract-boq-service` |

**Rules:**
- Branch from `main` (or the current sprint integration branch if team adopts one)
- One sprint feature branch per sprint, or smaller branches per deliverable merged via PR
- Delete branches after merge
- Never commit directly to `main` during active development

### 5.2 Conventional Commits

All commits follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

| Prefix | Usage | Example |
|--------|-------|---------|
| `feat:` | New feature or sprint deliverable | `feat: add WBS tree expand collapse` |
| `fix:` | Bug fix | `fix: correct grand total calculation` |
| `docs:` | Documentation only | `docs: add development guide` |
| `refactor:` | Code change, no feature/fix | `refactor: extract currency formatter` |
| `style:` | Formatting, no logic change | `style: apply prettier to boq module` |
| `chore:` | Tooling, deps, CI | `chore: add eslint config` |

**Format:**
```
<type>: <short description>

[optional body]

[optional footer]
```

**Examples:**
```
feat: add projects list with search and status filter

fix: prevent duplicate project code on concurrent create

docs: update database design with soft delete strategy

chore: configure prettier and lint-staged
```

**Rules:**
- Subject line ≤ 72 characters
- Use imperative mood ("add", not "added")
- One logical change per commit
- Reference sprint number in body when helpful: `Sprint 4 — WBS tree UI`

### 5.3 Pull Request Guidelines

- PR title matches Conventional Commit format
- PR description: what changed, how to test, sprint reference
- PR must pass CI (build, lint, typecheck) before merge
- Self-review checklist (Section 8) completed before requesting review
- Squash merge to `main` for feature branches (team preference)

### 5.4 Milestone Tags

At the end of each sprint, tag `main` with a milestone:

| Sprint | Tag |
|--------|-----|
| Sprint 1 | `v1.0.0-sprint-1` |
| Sprint 2 | `v1.0.0-sprint-2` |
| Sprint 3 | `v1.0.0-sprint-3` |
| Sprint 4 | `v1.0.0-sprint-4` |
| Sprint 5 | `v1.0.0-sprint-5` |
| Sprint 6 (release) | `v1.0.0` |

```bash
git tag -a v1.0.0-sprint-1 -m "Sprint 1: Foundation and Authentication"
git push origin v1.0.0-sprint-1
```

---

## 6. Sprint Workflow

Every sprint follows the same seven-step cycle. Do not skip steps.

```
Implement → Build → Run → Test → Fix → Commit → Tag milestone
```

### 6.1 Step-by-Step

| Step | Action | Command / Criteria |
|------|--------|-------------------|
| **1. Implement** | Build sprint deliverables per [SRS Section 8](./SRS_QUANTIX_V1.md) | Match sprint exit criteria |
| **2. Build** | Verify production build succeeds | `npm run build` — zero errors |
| **3. Run** | Start dev server and smoke-test all sprint screens | `npm run dev` — no startup errors |
| **4. Test** | Manual test against sprint exit criteria and SRS acceptance criteria | Document results in PR |
| **5. Fix** | Resolve all TypeScript errors, ESLint errors, and console errors found in steps 2–4 | Zero errors before commit |
| **6. Commit** | Small, focused Conventional Commits; open PR and merge to `main` | CI green |
| **7. Tag milestone** | Annotated git tag on `main` | `v1.0.0-sprint-N` |

### 6.2 Sprint Map

| Sprint | Goal | Branch example | Exit criteria |
|--------|------|----------------|---------------|
| **1** | Foundation and Authentication | `feature/sprint-1-auth` | Login, placeholder Dashboard, logout |
| **2** | Dashboard and Projects | `feature/sprint-2-projects` | Dashboard metrics, projects list with search/filter |
| **3** | Create Project and Project Details | `feature/sprint-3-project-details` | Create project, view/edit details, tab navigation |
| **4** | WBS | `feature/sprint-4-wbs` | Multi-level WBS tree with CRUD |
| **5** | BOQ and Estimate Summary | `feature/sprint-5-boq-estimate` | BOQ inline editing, rollups, estimate summary |
| **6** | Excel Export and Release | `feature/sprint-6-export-release` | Excel export, QA, all acceptance criteria pass |

### 6.3 Sprint Start Checklist

Before writing code for a new sprint:

- [ ] Previous sprint tagged and merged to `main`
- [ ] `main` builds cleanly (`npm run build`)
- [ ] No open TypeScript or ESLint errors on `main`
- [ ] Sprint deliverables reviewed against SRS Section 8
- [ ] Feature branch created from `main`
- [ ] Database migrations planned (if sprint requires schema changes)

### 6.4 Sprint End Checklist

See Section 8 (Quality Checklist) — all items must pass before tagging the milestone.

---

## 7. Environment and Tooling

### 7.1 Required Tools

| Tool | Purpose |
|------|---------|
| Node.js 20 LTS | Runtime |
| npm (or pnpm) | Package management |
| Git | Version control |
| Supabase CLI | Local migration management |
| VS Code / Cursor | Editor with ESLint and Prettier extensions |

### 7.2 Environment Variables

Stored in `.env.local` (never committed). Documented in `.env.example`:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (safe for client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin operations (seed scripts) |

### 7.3 NPM Scripts (Expected)

| Script | Purpose |
|--------|---------|
| `dev` | Start development server |
| `build` | Production build |
| `start` | Start production server |
| `lint` | Run ESLint |
| `lint:fix` | Auto-fix ESLint issues |
| `typecheck` | Run TypeScript compiler (`tsc --noEmit`) |
| `format` | Run Prettier |
| `format:check` | Verify Prettier formatting |

**Sprint gate commands** (all must pass):
```bash
npm run typecheck
npm run lint
npm run build
```

---

## 8. Quality Checklist

Complete this checklist before marking any sprint done and before tagging the milestone.

### 8.1 Code Quality

- [ ] **No TypeScript errors** — `npm run typecheck` passes
- [ ] **No ESLint errors** — `npm run lint` passes
- [ ] **No duplicate components** — shared UI lives in `components/`; no copy-pasted component files
- [ ] **No unused files** — dead code, unused exports, and orphan files removed
- [ ] **No `any` types** introduced without documented exception
- [ ] **No duplicated code** — shared logic extracted to `services/`, `lib/`, or `hooks/`

### 8.2 Runtime Quality

- [ ] **No console errors** — browser console clean during smoke test
- [ ] **No console warnings** — React hydration warnings and deprecation warnings resolved
- [ ] **Build succeeds** — `npm run build` completes with zero errors
- [ ] **Auth flows work** — login, logout, protected route redirect tested
- [ ] **Role-based UI** — Viewer cannot see edit/create/delete/export actions

### 8.3 UI Quality

- [ ] **Responsive UI** — tested at desktop (1280px), tablet (768px), and mobile (375px) per [UI_SPEC_V1.md](./UI_SPEC_V1.md) Section 5
- [ ] **Design system followed** — colors, typography, spacing match UI spec tokens
- [ ] **Empty states** — shown when no data (not blank screens)
- [ ] **Loading states** — skeleton or spinner shown during data fetch
- [ ] **Error states** — toast or inline error on failed operations
- [ ] **Dark mode tokens** — new components use semantic CSS variables (not hard-coded hex)

### 8.4 Data Quality

- [ ] **Database migrations applied** — local and staging Supabase projects up to date
- [ ] **RLS policies tested** — users cannot access unauthorized projects
- [ ] **Calculations verified** — BOQ totals and estimate summary match database design formulas
- [ ] **Soft delete respected** — deleted records excluded from queries

### 8.5 Release Readiness (Sprint 6 only)

- [ ] All SRS Section 7 acceptance criteria pass
- [ ] Cross-browser tested (Chrome, Edge, Firefox — latest 2 versions)
- [ ] Excel export produces valid `.xlsx` with correct data and filename
- [ ] Environment variables configured on Vercel production
- [ ] No secrets in source code
- [ ] **Ready for production** — deploy to Vercel preview, smoke test, promote to production

---

## 9. Database Development Rules

Aligned with [DATABASE_DESIGN_V1.md](./DATABASE_DESIGN_V1.md).

| Rule | Detail |
|------|--------|
| Additive only | New tables, columns, and indexes — no drops or renames in V1 |
| One migration per change | Timestamped SQL file in `supabase/migrations/` |
| RLS on every table | Enable Row Level Security; define policies per role |
| Regenerate types | After migration, update `types/database.ts` from Supabase CLI |
| Seed data | Administrator account and sample project in `supabase/seed.sql` (dev only) |
| Test migrations | Apply to local Supabase before pushing to staging |

---

## 10. Testing Approach (V1)

Automated test suites are not a V1 blocker. Testing is **manual and checklist-driven** per sprint.

| Sprint | Manual test focus |
|--------|------------------|
| 1 | Login, logout, session persistence, protected route redirect |
| 2 | Dashboard counts, recent projects, projects search/filter/pagination |
| 3 | Create project validation, edit project details, tab navigation |
| 4 | WBS tree CRUD, cascade delete, code uniqueness, viewer read-only |
| 5 | BOQ inline edit, auto-totals, WBS rollup, estimate summary, overhead fields |
| 6 | Excel export (3 sheets, filename, totals match), cross-browser, RBAC |

Document test results in the sprint PR description. Automated tests may be added in V2.

---

## 11. Deployment

See **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** for the full production deployment runbook (Vercel, Supabase, environment variables, migrations, backups, SSL, domain, monitoring, logging, checklist, and rollback).

| Environment | Trigger | Platform |
|-------------|---------|----------|
| Preview | PR merge or push to feature branch | Vercel preview URL |
| Production | Merge to `main` (after Sprint 6) | Vercel production |

**Pre-deploy checks:**
```bash
npm run deploy:preflight
```

1. Environment variables set in Vercel dashboard (see DEPLOYMENT_GUIDE §4)
2. Supabase migrations applied to production database (see DEPLOYMENT_GUIDE §5)
3. Smoke test on preview URL before promoting

---

## 12. Decision Log

Record significant technical decisions here during development.

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-25 | Next.js App Router with Server Components default | Aligns with Vercel hosting; reduces client bundle |
| 2026-06-25 | Supabase direct client + RLS (no custom API layer) | Simpler V1 architecture per ARCHITECTURE_V1 |
| 2026-06-25 | Manual testing for V1 | Speed to market; automated tests deferred to V2 |
| | | |

---

## 13. Out of Scope

This guide does not cover:

- Application source code or scaffolding
- SQL migrations or Prisma schema
- CI/CD pipeline configuration files
- Version 2 features or modules
- User provisioning admin UI
- Performance benchmarking tooling

---

## 14. Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Technical Lead | | | |
| Product Owner | | | |

---

*End of Document*
