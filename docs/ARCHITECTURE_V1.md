# Architecture — Quantix Version 1

| Field | Value |
|-------|-------|
| **Document** | ARCHITECTURE_V1 |
| **Product** | Quantix |
| **Version** | 1.0 |
| **Status** | Draft |
| **Last Updated** | 2026-06-25 |
| **Related** | [SRS_QUANTIX_V1.md](./SRS_QUANTIX_V1.md) |

---

## 1. Architecture Overview

Quantix V1 is a cloud-based estimating software accessed through a web browser. The application will be hosted on Vercel, with backend services, authentication, and PostgreSQL database handled by Supabase Cloud.

The system must not be designed as a desktop-only, local-only, or Electron application.

Quantix V1 is a browser-first, multi-tenant web application. Users access the system over HTTPS from any supported modern browser. All application state, business data, and authentication are managed in cloud services — there is no local database, offline-first sync layer, or installable desktop client in V1.

The functional surface area follows the module hierarchy defined in the SRS: **Login → Dashboard → Projects → Project Details → WBS → BOQ → Estimate Summary → Basic Excel Export**.

---

## 2. Deployment Target

| Layer | Platform | Responsibility |
|-------|----------|----------------|
| **Frontend** | Vercel | Hosts the web application; serves UI, client-side routing, and static assets |
| **Authentication** | Supabase Auth | User sign-in, session tokens, password hashing, and protected route enforcement |
| **Database** | Supabase PostgreSQL | Persistent storage for users, projects, WBS, BOQ, and audit data |
| **Storage (future)** | Supabase Storage | File storage if needed in later iterations (not required for V1 core scope) |
| **Access** | Browser-based cloud app | Users reach Quantix via URL; no local install required |

### 2.1 Environment Model

- **Production** — Vercel production deployment connected to Supabase production project.
- **Preview** — Vercel preview deployments per branch/PR, optionally connected to a Supabase staging project.
- **Local development** — Frontend dev server (e.g. Next.js) connecting to a Supabase development project; still cloud-backed, not local-only.

### 2.2 Explicit Non-Targets

The following are out of scope for V1 architecture:

- Desktop installers (Windows, macOS, Linux)
- Electron or Tauri wrappers
- Local-only SQLite or file-based databases
- On-premises server deployment
- Mobile-native applications

---

## 3. System Context

```
┌─────────────────────────────────────────────────────────────┐
│                        User (Browser)                        │
│              Chrome / Edge / Firefox (latest 2)              │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     Vercel (Frontend)                        │
│         Web app UI · routing · client-side logic             │
└──────────────┬──────────────────────────┬───────────────────┘
               │                          │
               │ Supabase client SDK        │ Excel export
               ▼                          ▼ (client-generated .xlsx)
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Cloud                            │
│  ┌─────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │ Supabase    │  │ PostgreSQL       │  │ Row Level     │ │
│  │ Auth        │  │ (managed)        │  │ Security      │ │
│  └─────────────┘  └──────────────────┘  └───────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

Users interact only with the browser. The frontend on Vercel communicates with Supabase for authentication and data. Excel export is generated in the browser or via a lightweight serverless function on Vercel — no separate file server is required for V1.

---

## 4. Technology Stack (V1)

| Concern | Choice | Notes |
|---------|--------|-------|
| Hosting | Vercel | Serverless deployment, CDN, preview environments |
| Frontend framework | TBD at implementation | Must support SSR/SSG or SPA patterns compatible with Vercel |
| Auth | Supabase Auth | Email/password for V1; SSO deferred |
| Database | Supabase PostgreSQL | Relational schema for projects, WBS, BOQ |
| API access | Supabase client + RLS | Direct client queries with Row Level Security policies |
| Excel export | Client-side library | Basic `.xlsx` generation per SRS FR-EXP requirements |

---

## 5. Application Layers

### 5.1 Presentation Layer (Vercel)

- Renders all V1 modules: Login, Dashboard, Projects, Create Project, Project Details, WBS, BOQ, Estimate Summary.
- Handles form validation, navigation, and user feedback.
- Manages Supabase Auth session state (login, logout, token refresh).
- Enforces role-based UI visibility (Administrator, Estimator, Viewer).

### 5.2 Data Access Layer (Supabase)

- PostgreSQL tables for core entities: `users` (profile/role), `projects`, `wbs_nodes`, `boq_items`, `audit_log`.
- **Row Level Security (RLS)** policies enforce per-role and per-project access at the database level.
- Computed totals (BOQ amounts, WBS rollups, project grand total) may be implemented as database views, triggers, or application-layer aggregation — decision deferred to implementation, but results must match SRS acceptance criteria.

### 5.3 Authentication Layer (Supabase Auth)

- Email and password authentication per SRS FR-AUTH requirements.
- JWT-based sessions consumed by the frontend Supabase client.
- Unauthenticated requests to protected resources are rejected; the frontend redirects to Login.

---

## 6. Data Model (High Level)

```
users ──────────────┐
                    │
projects ───────────┼── owned by user
  │                 │
  ├── wbs_nodes ────┘  (self-referential parent/child tree)
  │       │
  │       └── boq_items (linked to wbs_node)
  │
  └── (rollup totals derived from boq_items via wbs hierarchy)

audit_log ── references user + entity changes
```

Key relationships:

- One **project** has many **WBS nodes** arranged in a tree.
- One **WBS node** has many **BOQ line items**.
- **Estimate Summary** is a read-only aggregation over the WBS/BOQ hierarchy — not a separate persisted entity in V1.

---

## 7. Security Architecture

| Area | Approach |
|------|----------|
| Transport | HTTPS only (enforced by Vercel and Supabase) |
| Authentication | Supabase Auth with secure password hashing |
| Authorization | Role stored on user profile; RLS policies on all tables |
| Session | Supabase-managed JWT; frontend holds session in secure client storage |
| Data isolation | RLS ensures users access only permitted projects |
| Secrets | Supabase keys and service credentials stored in Vercel environment variables — never committed to source control |

---

## 8. Excel Export Architecture

Basic Excel export (V1) does not require Supabase Storage:

1. User triggers export from Project Details or Estimate Summary.
2. Frontend (or Vercel serverless function) queries project, WBS, and BOQ data from Supabase.
3. An `.xlsx` file is assembled with three sheets: Project Info, WBS Summary, BOQ Detail.
4. File is downloaded directly to the user's browser.

No persistent file storage is needed for V1 export. Supabase Storage remains available for future features if required.

---

## 9. Scalability and Performance (V1)

- Vercel serverless scaling handles frontend traffic spikes without manual provisioning.
- Supabase managed PostgreSQL handles V1 data volumes (target: up to 5,000 BOQ line items per project per SRS).
- Export operations should complete within 30 seconds for projects at that scale.
- No caching layer or CDN beyond Vercel defaults is required for V1.

---

## 10. Out of Scope (Architecture)

Aligned with [SRS_QUANTIX_V1.md](./SRS_QUANTIX_V1.md) Section 6:

- AI services or LLM integrations
- Procurement, contracts, and cash flow subsystems
- PlanSwift or external takeoff integrations
- Advanced reporting infrastructure
- Desktop, Electron, or local-only deployment models
- Version 2 platform features (multi-region, event bus, microservices split)

---

## 11. Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Technical Lead | | | |
| Product Owner | | | |

---

*End of Document*
