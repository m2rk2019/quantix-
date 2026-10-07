# Authorization and User Roles Specification — Quantix Version 1

| Field | Value |
|-------|-------|
| **Document** | AUTHORIZATION_V1 |
| **Product** | Quantix |
| **Version** | 1.0 |
| **Status** | Draft |
| **Last Updated** | 2026-06-25 |
| **Related** | [SRS_QUANTIX_V1.md](./SRS_QUANTIX_V1.md) · [DATABASE_DESIGN_V1.md](./DATABASE_DESIGN_V1.md) · [ARCHITECTURE_V1.md](./ARCHITECTURE_V1.md) · [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) |

---

## 1. Purpose

This document defines the **authorization model** for Quantix V1: user roles, module-level permissions, enforcement principles, and extension points for future commercial modules (Procurement, Contracts).

It answers:

- Who can access each V1 module?
- What actions can each role perform?
- How are permissions enforced?
- How will the model extend without breaking V1?

**Out of scope for this document:** Implementation code, SQL RLS policies, middleware, or UI component logic.

---

## 2. Authorization Overview

Quantix V1 uses **Role-Based Access Control (RBAC)**. Every authenticated user is assigned exactly **one role** stored on their user profile (`public.users.role`). Permissions are derived from that role — not from per-user custom grants in V1.

### 2.1 Enforcement Layers

| Layer | Responsibility |
|-------|----------------|
| **Supabase Auth** | Identity verification (email/password), session tokens |
| **Application UI** | Hide or disable actions the role cannot perform |
| **Application server** | Reject unauthorized Server Actions and route handlers |
| **PostgreSQL RLS** | Final data-layer enforcement on all `public` tables |

All three application layers must agree. UI-only restrictions are insufficient — RLS and server checks are mandatory.

### 2.2 Relationship to SRS V1

The [SRS](./SRS_QUANTIX_V1.md) originally defined three roles: **Administrator**, **Estimator**, and **Viewer**. This specification **expands** the role model to five roles for finer commercial-team alignment:

| SRS role | Maps to |
|----------|---------|
| Administrator | **Admin** (operational admin) or **Super Admin** (platform owner) |
| Estimator | **Estimator** |
| *(not in SRS)* | **Quantity Surveyor** (dedicated QS workflow) |
| Viewer | **Viewer** |

Implementers should treat this document as the **authoritative permission source** when it differs from the SRS role table. The SRS functional requirements remain valid; this document refines who may satisfy them.

### 2.3 V1 Scope Boundaries

| In V1 authorization scope | Deferred to V1.5+ |
|----------------------------|-------------------|
| Five roles with module permissions | Granular per-project role overrides |
| Project ownership (`created_by`) | `project_members` sharing table |
| User Management permissions defined | User Management admin UI (V1.5 per roadmap) |
| RLS by role + ownership | Organization / multi-company isolation (V3) |

User Management permissions are **defined here** so RLS and UI can be built consistently. In V1, user provisioning may occur via Supabase Dashboard or seed scripts until the admin UI ships.

---

## 3. Roles

### 3.1 Role Hierarchy

Roles are **not nested** for permission inheritance. Each role has an explicit permission set. For reference, approximate privilege level (highest first):

```
Super Admin  >  Admin  >  Quantity Surveyor  ≈  Estimator  >  Viewer
```

Quantity Surveyor and Estimator are **peer roles** with different project scope — not a strict hierarchy between them.

### 3.2 Role Definitions

| Role | Code | Description | Typical user |
|------|------|-------------|--------------|
| **Super Admin** | `super_admin` | Platform-level control. Full access to all modules, all projects, and all user accounts including other admins. | Software owner, IT director |
| **Admin** | `admin` | Organization administrator. Manages users and has full project access. Cannot manage Super Admin accounts. | Office manager, commercial director |
| **Estimator** | `estimator` | Builds and maintains estimates on **own projects** (projects where `created_by` equals the user). | Junior/senior estimator |
| **Quantity Surveyor** | `quantity_surveyor` | Professional QS with **cross-project** estimating access. Maintains WBS, BOQ, and estimate quality across the portfolio. | Quantity surveyor, senior QS |
| **Viewer** | `viewer` | Read-only stakeholder. Reviews dashboards, projects, and estimates without modifying data. | Project manager, client liaison, director (review only) |

### 3.3 Role Assignment Rules

| Rule | Detail |
|------|--------|
| Single role | Each user has exactly one role at a time |
| Provisioning | Only Super Admin and Admin may create user accounts |
| Role changes | Only Super Admin may assign or change the `super_admin` role |
| Admin limits | Admin may assign roles: `admin`, `estimator`, `quantity_surveyor`, `viewer` — not `super_admin` |
| Self-demotion | No user may change their own role |
| Deactivation | Super Admin and Admin may deactivate users; a user cannot deactivate themselves |
| Minimum admin | At least one active Super Admin must exist at all times |

### 3.4 Database Representation

The `public.users.role` column stores the role code as an enum:

```
super_admin | admin | estimator | quantity_surveyor | viewer
```

This extends the three-value enum in [DATABASE_DESIGN_V1.md](./DATABASE_DESIGN_V1.md) via an additive migration before Sprint 1 auth work is complete.

---

## 4. Permission Legend

Permissions in Section 5 use the following codes:

| Code | Meaning |
|------|---------|
| **✅ Full** | Unrestricted access including create, read, update, delete (where the module supports those actions) |
| **✅ Own** | Full access limited to **own projects** (`projects.created_by = current user`) |
| **👁 Read** | View only; no create, edit, or delete |
| **❌ None** | No access; module hidden or route returns 403 |

### 4.1 Project Scope

| Scope | Definition |
|-------|------------|
| **All projects** | Every non-deleted project in the system |
| **Own projects** | Projects where the authenticated user is `created_by` (Project Owner) |
| **Accessible projects** | All projects for roles with portfolio scope; own projects only for Estimator |

---

## 5. Permission Matrix

### 5.1 Module Permissions by Role

| Module / Action | Super Admin | Admin | Estimator | Quantity Surveyor | Viewer |
|-----------------|:-----------:|:-----:|:---------:|:---------------:|:------:|
| **Login** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Dashboard** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | 👁 Read |
| **Projects** (list/view) | ✅ All | ✅ All | ✅ Own | ✅ All | 👁 All |
| **Create Project** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Edit Project** | ✅ All | ✅ All | ✅ Own | ✅ All | ❌ |
| **Delete Project** | ✅ All | ✅ All | ✅ Own | ❌ | ❌ |
| **WBS** | ✅ All | ✅ All | ✅ Own | ✅ All | 👁 All |
| **BOQ** | ✅ All | ✅ All | ✅ Own | ✅ All | 👁 All |
| **Estimate Summary** | ✅ All | ✅ All | ✅ Own | ✅ All | 👁 All |
| **Excel Export** | ✅ All | ✅ All | ✅ Own | ✅ All | ❌ |
| **User Management** | ✅ Full | ✅ Limited | ❌ | ❌ | ❌ |

### 5.2 Detailed Permission Specifications

#### Login

| Role | Permission |
|------|------------|
| Super Admin | Sign in, sign out, session refresh |
| Admin | Sign in, sign out, session refresh |
| Estimator | Sign in, sign out, session refresh |
| Quantity Surveyor | Sign in, sign out, session refresh |
| Viewer | Sign in, sign out, session refresh |

- Unauthenticated users may access `/login` only.
- Deactivated users (`users.deleted_at` set) cannot authenticate.

---

#### Dashboard

| Role | Permission |
|------|------------|
| Super Admin | View all statistics, all recent projects, all quick actions |
| Admin | View all statistics, all recent projects, all quick actions |
| Estimator | View statistics for **own projects**; recent projects limited to own; Create Project quick action visible |
| Quantity Surveyor | View statistics across **all projects**; all recent projects; Create Project quick action visible |
| Viewer | View statistics across accessible projects; **no** Create Project quick action |

---

#### Projects (list and view)

| Role | Permission |
|------|------------|
| Super Admin | List, search, filter, sort, and open all projects |
| Admin | List, search, filter, sort, and open all projects |
| Estimator | List, search, filter, sort, and open **own projects** only |
| Quantity Surveyor | List, search, filter, sort, and open **all projects** |
| Viewer | List, search, filter, sort, and open **all projects** (read-only) |

---

#### Create Project

| Role | Permission |
|------|------------|
| Super Admin | Create projects; becomes Project Owner (`created_by`) |
| Admin | Create projects; becomes Project Owner |
| Estimator | Create projects; becomes Project Owner |
| Quantity Surveyor | Create projects; becomes Project Owner |
| Viewer | **Denied** — Create Project button hidden; `/projects/new` returns 403 |

---

#### Edit Project

| Role | Permission |
|------|------------|
| Super Admin | Edit metadata and status on **any** project |
| Admin | Edit metadata and status on **any** project |
| Estimator | Edit metadata and status on **own projects** only |
| Quantity Surveyor | Edit metadata and status on **any** project |
| Viewer | **Denied** — read-only Project Details |

Editable fields: project header, project details, and estimate summary overhead fields (where applicable).

---

#### Delete Project

| Role | Permission |
|------|------------|
| Super Admin | Soft-delete **any** project (with confirmation) |
| Admin | Soft-delete **any** project (with confirmation) |
| Estimator | Soft-delete **own projects** only (with confirmation) |
| Quantity Surveyor | **Denied** — QS maintains estimate data but does not delete projects |
| Viewer | **Denied** |

Deleting a project cascades soft-delete to WBS, BOQ, and related records per database design.

---

#### WBS

| Role | View | Create | Edit | Delete |
|------|:----:|:------:|:----:|:------:|
| Super Admin | All | All | All | All |
| Admin | All | All | All | All |
| Estimator | Own | Own | Own | Own |
| Quantity Surveyor | All | All | All | All |
| Viewer | All | ❌ | ❌ | ❌ |

Additional WBS actions (expand/collapse, copy/paste): Viewers may expand/collapse only; all write roles may use copy/paste on projects they can edit.

---

#### BOQ

| Role | View | Create | Edit | Delete |
|------|:----:|:------:|:----:|:------:|
| Super Admin | All | All | All | All |
| Admin | All | All | All | All |
| Estimator | Own | Own | Own | Own |
| Quantity Surveyor | All | All | All | All |
| Viewer | All | ❌ | ❌ | ❌ |

Auto-calculated fields (`total_rate`, `total_amount`, `direct_cost`, `grand_total`) follow the same edit rules as their parent row or summary.

---

#### Estimate Summary

| Role | View rollup | Edit overhead fields | View WBS tree |
|------|:-----------:|:--------------------:|:-------------:|
| Super Admin | All | All | All |
| Admin | All | All | All |
| Estimator | Own | Own | Own |
| Quantity Surveyor | All | All | All |
| Viewer | All | ❌ | All |

Overhead fields: `indirect_cost`, `contingency`, `markup`, `vat`. `direct_cost` and `grand_total` are computed — not directly editable by any role.

---

#### Excel Export

| Role | Permission |
|------|------------|
| Super Admin | Export any project to `.xlsx` |
| Admin | Export any project to `.xlsx` |
| Estimator | Export **own projects** only |
| Quantity Surveyor | Export **any** project |
| Viewer | **Denied** — Export button hidden; export endpoint returns 403 |

Export format per SRS FR-EXP: Project Info, WBS Summary, BOQ Detail sheets.

---

#### User Management

| Action | Super Admin | Admin | Estimator | Quantity Surveyor | Viewer |
|--------|:-----------:|:-----:|:---------:|:---------------:|:------:|
| View user list | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create user | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit user profile | ✅ | ✅ | ❌ | ❌ | ❌ |
| Assign role | ✅ All roles | ✅ Except `super_admin` | ❌ | ❌ | ❌ |
| Deactivate user | ✅ | ✅ | ❌ | ❌ | ❌ |
| Reactivate user | ✅ | ✅ | ❌ | ❌ | ❌ |
| Reset password | ✅ | ✅ | ❌ | ❌ | ❌ |

**Admin (Limited):** Admin has full User Management except:

- Cannot create, edit, deactivate, or change role of a **Super Admin**
- Cannot assign the `super_admin` role
- Cannot deactivate the last active Super Admin

**V1 implementation note:** Permissions are defined here; the admin UI may ship in V1.5. Until then, Super Admin and Admin actions are performed via Supabase Dashboard or controlled seed scripts.

---

## 6. Permission Principles

### 6.1 Least Privilege

Every role receives the **minimum permissions required** to perform its job function.

| Principle | Application in Quantix V1 |
|-----------|--------------------------|
| Default deny | Users cannot access modules or actions unless explicitly granted by their role |
| Narrow write scope | Estimators write only own projects; Viewers have no write access anywhere |
| No privilege escalation | Users cannot change their own role or grant themselves additional permissions |
| Separation of duties | Quantity Surveyors edit estimates across projects but cannot delete projects; Admins manage users but are distinct from Super Admins |
| Deactivation over deletion | User accounts are deactivated (soft delete), not hard-deleted, to preserve audit trails |

### 6.2 Role-Based Access Control (RBAC)

| Principle | Application in Quantix V1 |
|-----------|--------------------------|
| Single role per user | Permissions are computed from one role enum value — no permission accumulation |
| Consistent enforcement | Same role always produces the same permissions across UI, server, and RLS |
| Role at provisioning | Role is set when the account is created; changes require admin action |
| UI reflects role | Navigation, buttons, and inline editors are hidden or disabled — not merely unlabeled |
| Server validates role | Every mutation checks role before executing, independent of UI state |
| RLS is authoritative | Even direct database access respects RLS policies aligned with this matrix |

### 6.3 Defense in Depth

```
User request
    → Supabase Auth (valid session?)
    → Application route guard (role allowed for route?)
    → Server Action / API handler (role allowed for action?)
    → PostgreSQL RLS (role + ownership allowed for row?)
    → Response
```

A failure at any layer returns **403 Forbidden** or redirects to an appropriate page. Error messages must not leak sensitive data (e.g. "Project not found" instead of "Access denied" for missing vs forbidden projects).

### 6.4 Auditability

| Event | Logged fields (FR-X-002) |
|-------|--------------------------|
| User login / logout | `user_id`, timestamp |
| Project create / edit / delete | `user_id`, `project_id`, action, timestamp |
| WBS / BOQ mutations | `user_id`, entity id, action, timestamp |
| User management actions | `actor_id`, `target_user_id`, action, timestamp |
| Export | `user_id`, `project_id`, timestamp |

---

## 7. Access Scenarios

### 7.1 Estimator Workflow

1. Estimator logs in → Dashboard shows own project statistics.
2. Creates a project → becomes Project Owner.
3. Builds WBS, BOQ, and Estimate Summary on own project → full edit.
4. Exports own project to Excel → allowed.
5. Attempts to open another estimator's project → **403** or project not visible in list.
6. Attempts `/projects/new` as Viewer → N/A (Estimator allowed).

### 7.2 Quantity Surveyor Workflow

1. QS logs in → Dashboard shows organisation-wide statistics.
2. Opens any project → read/write WBS, BOQ, Estimate Summary.
3. Edits project metadata on any project → allowed.
4. Deletes a project → **denied**.
5. Exports any project → allowed.

### 7.3 Viewer Workflow

1. Viewer logs in → Dashboard visible (read-only).
2. Browses all projects → opens Project Details, WBS, BOQ, Estimate Summary in read-only mode.
3. No Create, Edit, Delete, or Export controls visible.
4. Direct URL to `/projects/new` → **403**.

### 7.4 Admin User Management

1. Admin opens User Management → lists active users.
2. Creates Estimator account → assigns `estimator` role.
3. Attempts to demote a Super Admin → **denied**.
4. Deactivates a Viewer → account cannot log in.

---

## 8. Future Expansion

### 8.1 Design for Extension

The V1 RBAC model is intentionally simple: **one role per user, project scope by ownership or all**. Future modules add permissions without changing V1 role definitions.

```
V1 roles (unchanged)
    └── V2 permission extensions
            ├── procurement.*
            ├── contracts.*
            └── cash_flow.*
```

### 8.2 Version 2 — Procurement and Contracts

New modules introduce **module-level permission flags** or a `role_permissions` lookup table. V1 roles map to default V2 permissions:

| V1 Role | Procurement (V2 default) | Contracts (V2 default) |
|---------|-------------------------|------------------------|
| Super Admin | Full | Full |
| Admin | Full | Full |
| Estimator | Read + create PR | Read |
| Quantity Surveyor | Read + approve PR | Read + create variations |
| Viewer | Read | Read |

**Extension approach (no V1 breaking changes):**

1. Add `permissions` JSONB column to `users` — **not recommended** (hard to audit).
2. **Recommended:** Add `role_permissions` table: `(role, module, action, allowed)` seeded per version.
3. Add `project_members` table for per-project role overrides: `(project_id, user_id, role)`.
4. RLS policies join `project_members` when present; fall back to V1 ownership rules when absent.

### 8.3 Version 3 — Multi-Company

| Addition | Authorization impact |
|----------|---------------------|
| `organizations` table | All RLS policies gain `organization_id` filter |
| Super Admin | Cross-organization (platform level) |
| Admin | Scoped to single organization |
| Other roles | Unchanged within organization boundary |

### 8.4 Permission Versioning

When V2 permissions ship:

- V1 roles retain all V1 permissions (backward compatible).
- New module permissions default to **deny** unless explicitly granted in `role_permissions` seed data.
- Document each permission change in a new `AUTHORIZATION_V2.md` or versioned section.

---

## 9. RLS Policy Guidelines (V1)

Implementation guidance for database policies — not executable SQL.

### 9.1 Helper Functions

| Function | Returns |
|----------|---------|
| `auth.user_role()` | Current user's role from `public.users` |
| `auth.is_super_admin()` | `true` if role = `super_admin` |
| `auth.is_admin_or_above()` | `true` if role IN (`super_admin`, `admin`) |
| `auth.can_write_all_projects()` | `true` if role IN (`super_admin`, `admin`, `quantity_surveyor`) |
| `auth.owns_project(project_id)` | `true` if `projects.created_by = auth.uid()` |

### 9.2 Policy Patterns

| Table | SELECT | INSERT / UPDATE / DELETE |
|-------|--------|--------------------------|
| `projects` | All roles: projects matching scope; Viewer+ all non-deleted | Write roles per matrix; ownership check for Estimator |
| `project_details` | Same as parent project | Same as parent project |
| `wbs` | Same as parent project | Same as parent project |
| `boq_items` | Same as parent project | Same as parent project |
| `estimate_summary` | Same as parent project | Same as parent project |
| `users` | Super Admin, Admin only | Super Admin full; Admin limited |

### 9.3 Viewer Policies

Viewers have `SELECT` policies on all project-scoped tables for non-deleted rows. Viewers have **no** `INSERT`, `UPDATE`, or `DELETE` policies.

---

## 10. UI Authorization Guidelines

Aligned with [UI_SPEC_V1.md](./UI_SPEC_V1.md).

| UI rule | Detail |
|---------|--------|
| Hide vs disable | Prefer **hiding** destructive actions; disable with tooltip only when showing capability matters |
| Viewer mode | All forms render read-only; no inline editors on BOQ |
| Route protection | Layout or middleware checks role before rendering shell pages |
| Badge | User menu displays role badge (`super_admin`, `admin`, `estimator`, `quantity_surveyor`, `viewer`) |
| Consistent denial | Viewer never sees Create, Edit, Delete, or Export on any screen |

---

## 11. Out of Scope (V1 Authorization)

- Per-project custom roles (`project_members` table)
- Attribute-based access control (ABAC)
- OAuth / SSO role mapping
- API keys and service accounts
- Temporary elevated access / impersonation
- Fine-grained field-level permissions (e.g. hide `markup` from QS)
- Procurement, Contracts, Cash Flow module permissions (defined in Section 8.2 for planning only)
- Implementation code, SQL, middleware, or tests

---

## 12. Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Technical Lead | | | |
| Security Lead | | | |

---

*End of Document*
