# Database Design Specification — Quantix Version 1

| Field | Value |
|-------|-------|
| **Document** | DATABASE_DESIGN_V1 |
| **Product** | Quantix |
| **Version** | 1.0 |
| **Status** | Draft |
| **Last Updated** | 2026-06-25 |
| **Related** | [SRS_QUANTIX_V1.md](./SRS_QUANTIX_V1.md) · [ARCHITECTURE_V1.md](./ARCHITECTURE_V1.md) |

---

## 1. Database Overview

### 1.1 Platform

Quantix V1 uses **PostgreSQL** hosted on **Supabase Cloud**. The database is the single source of truth for all application data: user profiles, projects, work breakdown structures, bill of quantities line items, and estimate summaries.

Authentication credentials (hashed passwords, session tokens) are managed by **Supabase Auth** (`auth` schema). Application user profiles and business data live in the **`public` schema**, linked to Supabase Auth via a shared user identifier.

### 1.2 Why a Relational Database

A relational model is the right fit for Quantix V1 because:

| Requirement | Relational advantage |
|-------------|---------------------|
| **Hierarchical WBS** | Self-referential foreign keys (`parent_id`) model unlimited tree depth with referential integrity |
| **BOQ linked to WBS** | Foreign keys enforce that every line item belongs to a valid WBS node and project |
| **Financial accuracy** | `NUMERIC` types with fixed precision avoid floating-point rounding errors on rates and amounts |
| **Multi-entity queries** | JOINs across projects, WBS, and BOQ support Dashboard aggregates, Estimate Summary rollups, and Excel export in a single query plan |
| **Role-based access** | Row Level Security (RLS) policies in PostgreSQL enforce per-user and per-role data isolation at the database layer |
| **Auditability** | Standard columns (`created_at`, `updated_at`, `created_by`, `updated_by`) and optional audit tables provide a clear change history |
| **Future modules** | New domains (Procurement, Contracts, Cash Flow) attach via new tables and foreign keys to `projects` without restructuring V1 tables |

### 1.3 Schema Scope (V1)

The V1 `public` schema contains six core tables:

| Table | Purpose |
|-------|---------|
| `users` | Application user profiles and roles (extends Supabase Auth) |
| `projects` | Project header and list-view fields |
| `project_details` | Extended project metadata (1:1 with `projects`) |
| `wbs` | Hierarchical Work Breakdown Structure per project |
| `boq_items` | Bill of Quantities line items linked to WBS nodes |
| `estimate_summary` | Project-level cost summary and markup configuration (1:1 with `projects`) |

### 1.4 Naming Conventions

- Table names: lowercase, plural (`projects`, `boq_items`)
- Primary keys: `id` (UUID)
- Foreign keys: `{referenced_table_singular}_id` (e.g. `project_id`, `wbs_id`)
- Timestamps: `TIMESTAMPTZ` (UTC storage, localized display in application)
- Monetary values: `NUMERIC(15, 2)` — two decimal places per SRS FR-X-001
- Quantities and rates: `NUMERIC(15, 2)` unless otherwise noted

### 1.5 Supabase Auth Integration

Supabase Auth stores credentials in `auth.users`. The `public.users` table holds the application profile:

- `users.id` **equals** `auth.users.id` (UUID, set on user provisioning)
- Email is duplicated in `public.users` for convenient querying and display; `auth.users.email` remains the authentication source of truth
- Passwords are **never** stored in `public.users`

---

## 2. Entity Relationship Diagram

```mermaid
erDiagram
    AUTH_USERS ||--|| USERS : "id = id"
    USERS ||--o{ PROJECTS : "created_by"
    USERS ||--o{ PROJECTS : "updated_by"
    PROJECTS ||--|| PROJECT_DETAILS : "has one"
    PROJECTS ||--o{ WBS : "contains"
    PROJECTS ||--|| ESTIMATE_SUMMARY : "has one"
    PROJECTS ||--o{ BOQ_ITEMS : "contains"
    WBS ||--o{ WBS : "parent_id"
    WBS ||--o{ BOQ_ITEMS : "assigned to"
    USERS ||--o{ WBS : "created_by"
    USERS ||--o{ BOQ_ITEMS : "created_by"

    AUTH_USERS {
        uuid id PK
        string email
        timestamptz created_at
    }

    USERS {
        uuid id PK
        string email UK
        string full_name
        enum role
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    PROJECTS {
        uuid id PK
        string project_code UK
        string project_name
        string client_name
        string location
        enum status
        uuid created_by FK
        uuid updated_by FK
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    PROJECT_DETAILS {
        uuid id PK
        uuid project_id FK_UK
        text description
        string owner
        string consultant
        date start_date
        date target_finish
        text remarks
        uuid created_by FK
        uuid updated_by FK
        timestamptz created_at
        timestamptz updated_at
    }

    WBS {
        uuid id PK
        uuid project_id FK
        uuid parent_id FK
        int level
        string wbs_code
        string description
        int sort_order
        uuid created_by FK
        uuid updated_by FK
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    BOQ_ITEMS {
        uuid id PK
        uuid project_id FK
        uuid wbs_id FK
        string item_code
        string description
        string unit
        numeric quantity
        numeric material_rate
        numeric labor_rate
        numeric equipment_rate
        numeric subcontract_rate
        numeric total_rate
        numeric total_amount
        uuid created_by FK
        uuid updated_by FK
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    ESTIMATE_SUMMARY {
        uuid id PK
        uuid project_id FK_UK
        numeric direct_cost
        numeric indirect_cost
        numeric contingency
        numeric markup
        numeric vat
        numeric grand_total
        uuid created_by FK
        uuid updated_by FK
        timestamptz created_at
        timestamptz updated_at
    }
```

> **Note:** `AUTH_USERS` represents Supabase's `auth.users` table (managed by Supabase Auth, not application migrations). All other tables are application-owned in `public`.

---

## 3. Tables

### 3.1 `users`

Application user profiles. One row per authenticated user.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | `UUID` | NO | Primary key. Matches `auth.users.id`. |
| `email` | `VARCHAR(255)` | NO | User email address. Unique. |
| `full_name` | `VARCHAR(255)` | NO | Display name shown on Dashboard and audit fields. |
| `role` | `ENUM` | NO | Application role: `administrator`, `estimator`, `viewer`. |
| `created_at` | `TIMESTAMPTZ` | NO | Row creation timestamp (UTC). Default: `now()`. |
| `updated_at` | `TIMESTAMPTZ` | NO | Last modification timestamp (UTC). Default: `now()`. |
| `deleted_at` | `TIMESTAMPTZ` | YES | Soft-delete timestamp. `NULL` = active user. |

**Constraints:**

- Primary key: `id`
- Unique: `email` (among non-deleted rows)
- Check: `role` IN (`administrator`, `estimator`, `viewer`)

**Notes:**

- Users are provisioned by Administrators (no self-registration in V1).
- Deactivating a user sets `deleted_at`; the linked `auth.users` account should also be disabled in Supabase Auth.

---

### 3.2 `projects`

Project header record. Powers the Projects list, Dashboard aggregates, and Create Project flow.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | `UUID` | NO | Primary key. |
| `project_code` | `VARCHAR(50)` | NO | Unique project identifier (e.g. `QX-2026-001`). |
| `project_name` | `VARCHAR(255)` | NO | Display name of the project. |
| `client_name` | `VARCHAR(255)` | NO | Client or employer name. |
| `location` | `VARCHAR(255)` | YES | Project site or region. |
| `status` | `ENUM` | NO | `draft`, `active`, `closed`. Default: `draft`. |
| `created_by` | `UUID` | NO | FK → `users.id`. User who created the project (Project Owner). |
| `updated_by` | `UUID` | YES | FK → `users.id`. User who last modified the project header. |
| `created_at` | `TIMESTAMPTZ` | NO | Row creation timestamp. |
| `updated_at` | `TIMESTAMPTZ` | NO | Last modification timestamp. |
| `deleted_at` | `TIMESTAMPTZ` | YES | Soft-delete timestamp. `NULL` = active project. |

**Constraints:**

- Primary key: `id`
- Unique: `project_code` (among non-deleted rows)
- Foreign key: `created_by` → `users.id`
- Foreign key: `updated_by` → `users.id`
- Check: `status` IN (`draft`, `active`, `closed`)

**Notes:**

- `created_by` is the Project Owner per SRS FR-CPROJ-004.
- Dashboard "total estimate value" is derived from `estimate_summary.grand_total` or BOQ rollups — not stored redundantly on `projects`.

---

### 3.3 `project_details`

Extended project metadata. One row per project (1:1 with `projects`). Powers the Project Details module.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | `UUID` | NO | Primary key. |
| `project_id` | `UUID` | NO | FK → `projects.id`. Unique (enforces 1:1). |
| `description` | `TEXT` | YES | Long-form project description. |
| `owner` | `VARCHAR(255)` | YES | Project owner name or organization (display field). |
| `consultant` | `VARCHAR(255)` | YES | Consultant or QS firm name. |
| `start_date` | `DATE` | YES | Planned or actual project start date. |
| `target_finish` | `DATE` | YES | Target completion date. |
| `remarks` | `TEXT` | YES | Free-text notes. |
| `created_by` | `UUID` | NO | FK → `users.id`. |
| `updated_by` | `UUID` | YES | FK → `users.id`. |
| `created_at` | `TIMESTAMPTZ` | NO | Row creation timestamp. |
| `updated_at` | `TIMESTAMPTZ` | NO | Last modification timestamp. |

**Constraints:**

- Primary key: `id`
- Unique: `project_id`
- Foreign key: `project_id` → `projects.id` ON DELETE CASCADE
- Foreign key: `created_by` → `users.id`
- Foreign key: `updated_by` → `users.id`
- Check: `target_finish` IS NULL OR `start_date` IS NULL OR `target_finish` >= `start_date`

**Notes:**

- A `project_details` row is created automatically when a project is created (same transaction or application workflow).
- `owner` is a display/metadata field distinct from `projects.created_by` (which is the system user who owns the record).

---

### 3.4 `wbs`

Work Breakdown Structure nodes. Supports **unlimited hierarchy** within a project via self-referential `parent_id`.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | `UUID` | NO | Primary key. |
| `project_id` | `UUID` | NO | FK → `projects.id`. Scopes node to a project. |
| `parent_id` | `UUID` | YES | FK → `wbs.id`. `NULL` = root-level node. |
| `level` | `INTEGER` | NO | Depth in tree. Root = `1`. Incremented per generation. |
| `wbs_code` | `VARCHAR(50)` | NO | Node code (e.g. `1.2.3`). Unique within project. |
| `description` | `VARCHAR(500)` | NO | Node name or description. |
| `sort_order` | `INTEGER` | NO | Display order among siblings. Default: `0`. |
| `created_by` | `UUID` | NO | FK → `users.id`. |
| `updated_by` | `UUID` | YES | FK → `users.id`. |
| `created_at` | `TIMESTAMPTZ` | NO | Row creation timestamp. |
| `updated_at` | `TIMESTAMPTZ` | NO | Last modification timestamp. |
| `deleted_at` | `TIMESTAMPTZ` | YES | Soft-delete timestamp. |

**Constraints:**

- Primary key: `id`
- Foreign key: `project_id` → `projects.id` ON DELETE CASCADE
- Foreign key: `parent_id` → `wbs.id` ON DELETE CASCADE
- Unique: (`project_id`, `wbs_code`) among non-deleted rows
- Check: `level` >= `1`
- Check: `parent_id` IS NULL OR `parent_id` != `id` (no self-reference)

#### Parent-Child Relationships

The WBS uses an **adjacency list** model:

```
Project
├── WBS (parent_id = NULL, level = 1)  "Division 1 - Preliminaries"
│   ├── WBS (parent_id = Division 1, level = 2)  "1.1 Site Setup"
│   └── WBS (parent_id = Division 1, level = 2)  "1.2 Temp Works"
└── WBS (parent_id = NULL, level = 1)  "Division 2 - Structure"
    └── WBS (parent_id = Division 2, level = 2)  "2.1 Foundations"
        └── WBS (parent_id = 2.1, level = 3)  "2.1.1 Piling"
```

**Rules:**

1. **Root nodes** have `parent_id = NULL` and `level = 1`.
2. **Child nodes** reference their parent's `id` in `parent_id`; `level = parent.level + 1`.
3. **Unlimited depth** — no maximum `level` constraint; tree depth is bounded only by application usability.
4. **Sibling ordering** — nodes sharing the same `parent_id` are sorted by `sort_order` ascending.
5. **Cascade delete** — deleting a WBS node soft-deletes (or hard-deletes per policy) all descendants and associated `boq_items`.
6. **Cross-project integrity** — a node's `parent_id`, if set, must reference a WBS row with the same `project_id` (enforced at application or database level).
7. **Rollup totals** — WBS nodes do not store totals in V1; subtotals are computed by summing `boq_items.total_amount` for the node and all descendants.

**Tree traversal** for Estimate Summary and Excel export uses recursive queries (e.g. PostgreSQL `WITH RECURSIVE`) ordered by `level`, `sort_order`.

---

### 3.5 `boq_items`

Bill of Quantities line items. Each row is a priced work item linked to exactly one WBS node and one project.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | `UUID` | NO | Primary key. |
| `project_id` | `UUID` | NO | FK → `projects.id`. Denormalized for query performance. |
| `wbs_id` | `UUID` | NO | FK → `wbs.id`. WBS node this item belongs to. |
| `item_code` | `VARCHAR(50)` | NO | Line item reference (e.g. `BOQ-001`). Unique within project. |
| `description` | `VARCHAR(500)` | NO | Work item description. |
| `unit` | `VARCHAR(20)` | NO | Unit of measure (e.g. `m²`, `m³`, `nr`, `item`). |
| `quantity` | `NUMERIC(15,2)` | NO | Measured quantity. Default: `0`. Must be >= 0. |
| `material_rate` | `NUMERIC(15,2)` | NO | Material cost per unit. Default: `0`. |
| `labor_rate` | `NUMERIC(15,2)` | NO | Labor cost per unit. Default: `0`. |
| `equipment_rate` | `NUMERIC(15,2)` | NO | Equipment cost per unit. Default: `0`. |
| `subcontract_rate` | `NUMERIC(15,2)` | NO | Subcontract cost per unit. Default: `0`. |
| `total_rate` | `NUMERIC(15,2)` | NO | Combined unit rate (computed). |
| `total_amount` | `NUMERIC(15,2)` | NO | Line total (computed). |
| `created_by` | `UUID` | NO | FK → `users.id`. |
| `updated_by` | `UUID` | YES | FK → `users.id`. |
| `created_at` | `TIMESTAMPTZ` | NO | Row creation timestamp. |
| `updated_at` | `TIMESTAMPTZ` | NO | Last modification timestamp. |
| `deleted_at` | `TIMESTAMPTZ` | YES | Soft-delete timestamp. |

**Constraints:**

- Primary key: `id`
- Foreign key: `project_id` → `projects.id` ON DELETE CASCADE
- Foreign key: `wbs_id` → `wbs.id` ON DELETE CASCADE
- Unique: (`project_id`, `item_code`) among non-deleted rows
- Check: `quantity` >= 0
- Check: all rate columns >= 0

#### Total Computation

BOQ line totals are derived from rate components and quantity:

```
total_rate    = material_rate + labor_rate + equipment_rate + subcontract_rate
total_amount  = quantity × total_rate
```

| Field | Stored or computed | When updated |
|-------|-------------------|--------------|
| `total_rate` | Stored (denormalized) | Recalculated on insert/update whenever any rate column changes |
| `total_amount` | Stored (denormalized) | Recalculated on insert/update whenever `quantity` or `total_rate` changes |

**Why store computed values?**

- Avoids repeated summation at query time across thousands of line items.
- Ensures Excel export and BOQ list views read a single consistent column.
- Values are maintained by application logic or database triggers at implementation time.

**Rounding:** All rate and amount fields use two decimal places. Half-up rounding is applied at each computation step.

**WBS / project integrity:** `boq_items.project_id` must match the `project_id` of the linked `wbs` row. This is validated on write to prevent orphaned cross-project references.

---

### 3.6 `estimate_summary`

Project-level estimate rollup. One row per project (1:1 with `projects`). Powers the Estimate Summary module and Excel export grand total.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | `UUID` | NO | Primary key. |
| `project_id` | `UUID` | NO | FK → `projects.id`. Unique (enforces 1:1). |
| `direct_cost` | `NUMERIC(15,2)` | NO | Sum of all BOQ line item amounts. Default: `0`. |
| `indirect_cost` | `NUMERIC(15,2)` | NO | Indirect/overhead cost amount. Default: `0`. |
| `contingency` | `NUMERIC(15,2)` | NO | Contingency allowance amount. Default: `0`. |
| `markup` | `NUMERIC(15,2)` | NO | Markup or profit amount. Default: `0`. |
| `vat` | `NUMERIC(15,2)` | NO | Value-added tax amount. Default: `0`. |
| `grand_total` | `NUMERIC(15,2)` | NO | Final project estimate total (computed). Default: `0`. |
| `created_by` | `UUID` | NO | FK → `users.id`. |
| `updated_by` | `UUID` | YES | FK → `users.id`. |
| `created_at` | `TIMESTAMPTZ` | NO | Row creation timestamp. |
| `updated_at` | `TIMESTAMPTZ` | NO | Last modification timestamp. |

**Constraints:**

- Primary key: `id`
- Unique: `project_id`
- Foreign key: `project_id` → `projects.id` ON DELETE CASCADE
- Foreign key: `created_by` → `users.id`
- Foreign key: `updated_by` → `users.id`
- Check: all cost columns >= 0

#### Summary Computation

```
direct_cost  = SUM(boq_items.total_amount) WHERE project_id = ? AND deleted_at IS NULL

grand_total  = direct_cost + indirect_cost + contingency + markup + vat
```

| Field | Stored or computed | When updated |
|-------|-------------------|--------------|
| `direct_cost` | Stored | Recalculated when any BOQ item for the project is created, updated, or deleted |
| `indirect_cost` | Stored | Set by user (absolute amount in V1) or derived from a percentage at implementation time |
| `contingency` | Stored | Set by user (absolute amount in V1) or derived from a percentage at implementation time |
| `markup` | Stored | Set by user (absolute amount in V1) or derived from a percentage at implementation time |
| `vat` | Stored | Set by user or computed as a percentage of a subtotal at implementation time |
| `grand_total` | Stored (denormalized) | Recalculated whenever any component column changes |

**Notes:**

- V1 stores overhead components as **absolute amounts** on `estimate_summary`. Percentage-based input (e.g. "10% contingency") may be supported in the UI but is converted to a stored amount before persistence.
- The hierarchical WBS rollup shown in the Estimate Summary UI is computed at read time from `wbs` + `boq_items`; only project-level totals are persisted in `estimate_summary`.
- An `estimate_summary` row is created automatically when a project is created, initialized to zero.

---

## 4. Relationships

### 4.1 Relationship Summary

| From | To | Cardinality | FK Column | On Delete |
|------|----|-------------|-----------|-----------|
| `users` | `auth.users` | 1:1 | `users.id` | Managed by Supabase Auth |
| `projects` | `users` | N:1 | `projects.created_by` | RESTRICT |
| `projects` | `users` | N:1 | `projects.updated_by` | SET NULL |
| `project_details` | `projects` | 1:1 | `project_details.project_id` | CASCADE |
| `project_details` | `users` | N:1 | `project_details.created_by` | RESTRICT |
| `project_details` | `users` | N:1 | `project_details.updated_by` | SET NULL |
| `wbs` | `projects` | N:1 | `wbs.project_id` | CASCADE |
| `wbs` | `wbs` | N:1 (self) | `wbs.parent_id` | CASCADE |
| `wbs` | `users` | N:1 | `wbs.created_by` | RESTRICT |
| `wbs` | `users` | N:1 | `wbs.updated_by` | SET NULL |
| `boq_items` | `projects` | N:1 | `boq_items.project_id` | CASCADE |
| `boq_items` | `wbs` | N:1 | `boq_items.wbs_id` | CASCADE |
| `boq_items` | `users` | N:1 | `boq_items.created_by` | RESTRICT |
| `boq_items` | `users` | N:1 | `boq_items.updated_by` | SET NULL |
| `estimate_summary` | `projects` | 1:1 | `estimate_summary.project_id` | CASCADE |
| `estimate_summary` | `users` | N:1 | `estimate_summary.created_by` | RESTRICT |
| `estimate_summary` | `users` | N:1 | `estimate_summary.updated_by` | SET NULL |

### 4.2 Foreign Key Explanations

**`projects.created_by` → `users.id`**
Identifies the user who created the project and serves as the Project Owner. Cannot be deleted if active projects reference them (RESTRICT).

**`projects.updated_by` → `users.id`**
Records the user who last edited the project header. Set to `NULL` if that user is removed.

**`project_details.project_id` → `projects.id`**
Links extended metadata to its project. CASCADE ensures details are removed when the parent project is hard-deleted.

**`wbs.project_id` → `projects.id`**
Scopes every WBS node to exactly one project. CASCADE removes the entire WBS tree when a project is hard-deleted.

**`wbs.parent_id` → `wbs.id`**
Establishes the tree hierarchy. A root node has `parent_id = NULL`. CASCADE deletes all descendants when a parent node is hard-deleted.

**`boq_items.project_id` → `projects.id`**
Denormalized project reference for efficient filtering (e.g. all BOQ items for a project without joining through `wbs`). Must agree with the `project_id` of the linked WBS node.

**`boq_items.wbs_id` → `wbs.id`**
Assigns each line item to a WBS node. CASCADE removes BOQ items when their WBS node is hard-deleted.

**`estimate_summary.project_id` → `projects.id`**
One summary per project. CASCADE removes the summary when the project is hard-deleted.

**`*.created_by` / `*.updated_by` → `users.id`**
Audit references on all mutable tables. `created_by` is set once at insert; `updated_by` is set on every update.

---

## 5. Index Strategy

Indexes support the query patterns defined in the SRS: Dashboard aggregates, project search/filter, WBS tree loading, BOQ listing, and Estimate Summary rollups.

### 5.1 Primary and Unique Indexes

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| All tables | PK (automatic) | `id` | Primary key lookups |
| `users` | UNIQUE | `email` WHERE `deleted_at IS NULL` | Login and profile lookup |
| `projects` | UNIQUE | `project_code` WHERE `deleted_at IS NULL` | Enforce unique codes (FR-CPROJ-002) |
| `project_details` | UNIQUE | `project_id` | Enforce 1:1 relationship |
| `wbs` | UNIQUE | (`project_id`, `wbs_code`) WHERE `deleted_at IS NULL` | Enforce unique WBS codes per project (FR-WBS-008) |
| `boq_items` | UNIQUE | (`project_id`, `item_code`) WHERE `deleted_at IS NULL` | Enforce unique item codes per project |
| `estimate_summary` | UNIQUE | `project_id` | Enforce 1:1 relationship |

### 5.2 Performance Indexes

| Table | Index | Columns | Supports |
|-------|-------|---------|----------|
| `projects` | `idx_projects_created_by` | `created_by` | List projects by owner |
| `projects` | `idx_projects_status` | `status` WHERE `deleted_at IS NULL` | Filter by status (FR-PROJ-004) |
| `projects` | `idx_projects_updated_at` | `updated_at DESC` WHERE `deleted_at IS NULL` | Dashboard recent projects (FR-DASH-002) |
| `projects` | `idx_projects_search` | `project_name`, `client_name` (GIN/trigram) | Text search (FR-PROJ-003) |
| `wbs` | `idx_wbs_project_id` | `project_id` WHERE `deleted_at IS NULL` | Load full WBS tree for a project |
| `wbs` | `idx_wbs_parent_id` | `parent_id` WHERE `deleted_at IS NULL` | Fetch children of a node |
| `wbs` | `idx_wbs_sort` | (`project_id`, `parent_id`, `sort_order`) WHERE `deleted_at IS NULL` | Ordered tree rendering |
| `boq_items` | `idx_boq_project_id` | `project_id` WHERE `deleted_at IS NULL` | All BOQ items for a project |
| `boq_items` | `idx_boq_wbs_id` | `wbs_id` WHERE `deleted_at IS NULL` | BOQ items for a WBS node (FR-BOQ-001) |
| `boq_items` | `idx_boq_amount` | `total_amount` WHERE `deleted_at IS NULL` | Sort by amount (FR-BOQ-005) |
| `estimate_summary` | `idx_estimate_project_id` | `project_id` | Summary lookup by project |

### 5.3 Index Guidelines

- **Partial indexes** (`WHERE deleted_at IS NULL`) keep indexes small and exclude soft-deleted rows from unique constraints and list queries.
- **Trigram index** on `projects.project_name` and `projects.client_name` (via `pg_trgm` extension) supports `ILIKE` search; enable only if search performance requires it.
- **Avoid over-indexing** write-heavy tables (`boq_items`) beyond the indexes listed above until query profiling identifies bottlenecks.
- **Recursive CTE** queries on `wbs` benefit from `idx_wbs_project_id` and `idx_wbs_parent_id` but do not require a materialized path column in V1.

---

## 6. Audit Fields

### 6.1 Standard Timestamp Fields

| Field | Applied to | Purpose |
|-------|-----------|---------|
| `created_at` | All tables | Immutable record of when the row was first inserted. Set once at creation. |
| `updated_at` | All tables | Last modification time. Updated on every write operation (application or trigger). |

**Usage:**

- Dashboard "recently updated projects" sorts by `projects.updated_at`.
- BOQ and WBS edits bump `updated_at` on the affected row and optionally on the parent `projects` row.
- Display formatting (timezone, locale) is handled in the application layer.

### 6.2 User Reference Fields

| Field | Applied to | Purpose |
|-------|-----------|---------|
| `created_by` | `projects`, `project_details`, `wbs`, `boq_items`, `estimate_summary` | UUID of the user who created the row. Set at insert; never changed. |
| `updated_by` | `projects`, `project_details`, `wbs`, `boq_items`, `estimate_summary` | UUID of the user who last modified the row. Set on every update. |

**Usage:**

- Supports accountability and future audit trail UI.
- Aligns with SRS FR-X-002 (audit logging). A dedicated `audit_log` table may be added at implementation time to capture field-level change history without altering V1 table structures.

### 6.3 `users` Table Audit

The `users` table carries `created_at` and `updated_at` but not `created_by`/`updated_by` (users are provisioned by Administrators, not self-referenced).

### 6.4 Automatic `updated_at` Maintenance

At implementation time, a shared trigger or application middleware should set `updated_at = now()` on every UPDATE. This ensures consistency regardless of which module initiates the change.

---

## 7. Soft Delete Strategy

### 7.1 Approach

Quantix V1 uses **soft delete** for user-facing entities. Rows are not physically removed from the database during normal operations; instead, a `deleted_at` timestamp is set.

| Table | Soft delete (`deleted_at`) | Hard delete |
|-------|---------------------------|-------------|
| `users` | Yes | Admin-only; disables auth account |
| `projects` | Yes | Admin-only; cascades to child tables |
| `project_details` | No (follows project) | CASCADE with project |
| `wbs` | Yes | CASCADE to children and BOQ items |
| `boq_items` | Yes | Rare; prefer soft delete |
| `estimate_summary` | No (follows project) | CASCADE with project |

### 7.2 Soft Delete Behavior

1. **Setting `deleted_at`** — On user-initiated delete, the application sets `deleted_at = now()` and `updated_by` to the current user.
2. **WBS cascade** — Soft-deleting a WBS node also soft-deletes all descendant WBS nodes and their BOQ items in the same transaction.
3. **Query filtering** — All application queries and RLS policies include `WHERE deleted_at IS NULL` by default.
4. **Unique constraints** — Partial unique indexes (`WHERE deleted_at IS NULL`) allow reuse of codes (e.g. `project_code`) only if business rules permit; otherwise codes remain reserved.
5. **Restore** — V1 does not include a restore UI. Administrators may clear `deleted_at` directly for recovery (out of band).

### 7.3 Hard Delete

Hard delete (physical `DELETE`) is reserved for:

- GDPR or data-retention compliance requests
- Administrator cleanup of test data
- Cascade when a parent project is hard-deleted

Hard delete on `projects` CASCADE removes `project_details`, `wbs`, `boq_items`, and `estimate_summary` via foreign key constraints.

### 7.4 Why Soft Delete

- Preserves referential integrity and audit history.
- Allows future "trash" or restore features without schema changes.
- Prevents accidental permanent data loss from UI delete actions.
- Supports compliance with SRS FR-WBS-005 and FR-BOQ-006 (confirmed delete) while retaining recoverability.

---

## 8. Future Scalability

The V1 schema is designed as a **stable foundation**. Future modules attach via new tables with foreign keys to existing entities — no modifications to V1 table structures are required.

### 8.1 Extension Pattern

```
projects (V1 — unchanged)
  ├── project_details (V1)
  ├── wbs (V1)
  ├── boq_items (V1)
  ├── estimate_summary (V1)
  │
  ├── [V2] procurement_orders      → project_id FK
  ├── [V2] contracts               → project_id FK
  ├── [V2] cash_flow_periods       → project_id FK
  ├── [V2] takeoff_imports         → project_id FK
  └── [V2] ai_estimate_sessions    → project_id FK
```

### 8.2 Future Module Mapping

| Future module | How it attaches | V1 impact |
|---------------|-----------------|-----------|
| **Procurement** | New tables: `vendors`, `purchase_orders`, `po_line_items`. `purchase_orders.project_id` → `projects.id`. Optional `po_line_items.boq_item_id` → `boq_items.id` for traceability. | None — additive tables only |
| **Contracts** | New tables: `contracts`, `variations`, `claims`. `contracts.project_id` → `projects.id`. | None — additive tables only |
| **Cash Flow** | New tables: `cash_flow_periods`, `payment_schedules`. `cash_flow_periods.project_id` → `projects.id`. Reads `estimate_summary.grand_total` for S-curve baseline. | None — reads V1 data via FK |
| **PlanSwift / Takeoff** | New table: `takeoff_imports` with `project_id` FK. Imported quantities map into `boq_items` via `takeoff_import_lines.boq_item_id`. | None — BOQ schema already supports quantity updates |
| **AI** | New tables: `ai_sessions`, `ai_suggestions`. `ai_sessions.project_id` → `projects.id`. AI reads WBS/BOQ context; writes suggestions to a staging table before user approval. | None — no AI columns on V1 tables |
| **Advanced reports** | New tables: `report_templates`, `report_runs`. Read-only queries against V1 tables. | None — read-only consumption |
| **Multi-user project sharing** | New table: `project_members` (`project_id`, `user_id`, `role`). RLS policies updated to check membership. | None — V1 `created_by` remains owner; sharing is additive |
| **Estimate versioning** | New tables: `estimate_versions`, `estimate_version_snapshots`. Snapshots copy BOQ/WBS state at a point in time. | None — V1 tables unchanged; versions are overlays |

### 8.3 Design Principles for Future Growth

1. **Project as anchor** — `projects.id` is the root foreign key for all future domain tables.
2. **BOQ as cost source** — `boq_items` remains the authoritative direct-cost line-item store; future modules reference it rather than duplicating amounts.
3. **No JSON blobs for core data** — Structured columns and normalized tables keep data queryable and enforceable via constraints.
4. **Additive migrations only** — V2+ features add tables, indexes, and RLS policies; they do not rename or repurpose V1 columns.
5. **Supabase RLS extensible** — New modules add policies alongside existing ones without rewriting V1 policies.
6. **Optional `audit_log` table** — A generic `audit_log(entity_type, entity_id, action, changed_by, changed_at, payload)` can be introduced at any time without altering V1 tables.

### 8.4 Capacity Headroom

| Metric | V1 target | PostgreSQL / Supabase headroom |
|--------|-----------|-------------------------------|
| BOQ items per project | 5,000 | Millions per table with proper indexing |
| WBS depth | Unlimited (practical: 10+) | Adjacency list performant to ~10k nodes per project |
| Projects per organization | Hundreds | Horizontal scale via Supabase plan upgrades |
| Concurrent users | Tens | Supabase connection pooling (PgBouncer) |

---

## 9. Row Level Security (RLS) Overview

RLS policies are defined at implementation time. The following access model aligns with SRS Section 2:

| Role | `projects` | `wbs` / `boq_items` | `estimate_summary` |
|------|-----------|---------------------|-------------------|
| Administrator | Full CRUD on all | Full CRUD on all | Read all |
| Estimator | CRUD on own projects | CRUD on own project data | Read on own projects |
| Viewer | Read all accessible | Read only | Read only |

"Own projects" is defined as `projects.created_by = auth.uid()` in V1. Future `project_members` table extends this without changing V1 columns.

---

## 10. Out of Scope

The following are **not** part of the V1 database design:

- AI model storage, embeddings, or prompt history tables
- Procurement, vendor, and purchase order tables
- Contract, variation, and claims tables
- Cash flow, payment schedule, and S-curve tables
- PlanSwift import staging tables
- Estimate version snapshot tables
- File attachment metadata (Supabase Storage integration deferred)
- SQL migrations, Prisma schema, or seed scripts

---

## 11. Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Technical Lead | | | |
| Product Owner | | | |
| Database Administrator | | | |

---

*End of Document*
