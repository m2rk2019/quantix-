# Software Requirements Specification — Quantix Version 1

| Field | Value |
|-------|-------|
| **Document** | SRS_QUANTIX_V1 |
| **Product** | Quantix |
| **Version** | 1.0 |
| **Status** | Draft |
| **Last Updated** | 2026-06-25 |

---

## 1. Product Overview

### 1.1 Purpose

Quantix V1 is a web-based construction estimating application that enables quantity surveyors, estimators, and project managers to create, organize, and manage project cost estimates. The system provides a structured workflow from project setup through Work Breakdown Structure (WBS), Bill of Quantities (BOQ) line items, and consolidated estimate summaries, with basic Excel export for offline sharing and review.

### 1.2 Problem Statement

Construction estimating teams often rely on disconnected spreadsheets and manual processes to build estimates. This leads to inconsistent structures, difficulty tracking project-level totals, and time-consuming handoffs between team members. Quantix V1 centralizes project and estimate data in a single application with a clear hierarchy: **Project → WBS → BOQ → Estimate Summary**.

### 1.3 Goals (V1)

- Provide secure user authentication and role-based access.
- Allow users to create and manage multiple construction projects.
- Support hierarchical WBS organization aligned with industry estimating practice.
- Enable BOQ line-item entry with quantities, units, rates, and calculated amounts.
- Present a consolidated estimate summary at project and WBS levels.
- Export estimate data to Excel in a basic, readable format.

### 1.4 Target Users

- **Quantity Surveyors (QS)** — primary users who build and maintain BOQs and estimates.
- **Estimators** — users who create project estimates and update pricing.
- **Project Managers** — users who review project status, totals, and exported summaries.
- **Administrators** — users who manage accounts and system access (limited V1 scope).

### 1.5 Assumptions

- Users have modern web browsers and stable internet connectivity.
- Currency and unit conventions are configured at the project level (single currency per project in V1).
- V1 does not integrate with external takeoff, ERP, or procurement systems.
- Excel export uses a standard `.xlsx` format compatible with Microsoft Excel and Google Sheets.

### 1.6 Constraints

- V1 is a greenfield release with no AI-assisted features.
- No real-time collaboration or concurrent editing safeguards beyond last-write-wins.
- No mobile-native application; responsive web layout is desirable but not a V1 blocker.

---

## 2. User Roles

| Role | Description | V1 Permissions |
|------|-------------|----------------|
| **Administrator** | Manages user accounts and system configuration. | Full access to all projects; create/edit/deactivate users; view all modules. |
| **Estimator** | Creates and maintains project estimates. | Create and edit own projects; full WBS/BOQ access on assigned projects; export to Excel. |
| **Viewer** | Read-only stakeholder. | View Dashboard, Projects, Project Details, WBS, BOQ, and Estimate Summary; no create/edit/delete; no export (optional — see FR-EXP-001). |

### 2.1 Role Rules

- Every authenticated user must have exactly one role.
- Project ownership: the user who creates a project is the **Project Owner** and may edit all project data unless restricted by a future sharing model (out of V1 scope).
- Administrators may access any project regardless of ownership.
- Viewers may not create projects, WBS nodes, or BOQ line items.

---

## 3. Modules

Quantix V1 comprises nine functional modules delivered as integrated screens within a single application.

| # | Module | Description |
|---|--------|-------------|
| 1 | **Login** | Authentication entry point; session management. |
| 2 | **Dashboard** | Landing page after login; summary of projects and key metrics. |
| 3 | **Projects** | Searchable, filterable list of all projects accessible to the user. |
| 4 | **Create Project** | Form-driven workflow to initialize a new project. |
| 5 | **Project Details** | Read/edit view of project metadata and navigation hub to WBS, BOQ, and Estimate Summary. |
| 6 | **WBS** | Hierarchical Work Breakdown Structure editor and viewer. |
| 7 | **BOQ** | Bill of Quantities line-item management tied to WBS nodes. |
| 8 | **Estimate Summary** | Rolled-up cost totals by WBS level and project. |
| 9 | **Basic Excel Export** | One-click export of estimate data to `.xlsx`. |

### 3.1 Module Dependencies

```
Login → Dashboard → Projects → Create Project → Project Details
                                                    ↓
                                              WBS → BOQ → Estimate Summary
                                                    ↓
                                           Basic Excel Export
```

---

## 4. User Workflow

### 4.1 Primary Workflow — New Estimate

1. User navigates to **Login** and authenticates with email and password.
2. User lands on the **Dashboard** and reviews recent or active projects.
3. User opens **Projects** or selects **Create Project** from the Dashboard.
4. User completes the **Create Project** form (name, code, client, dates, currency, description).
5. System creates the project and redirects to **Project Details**.
6. User opens **WBS** and builds the work hierarchy (e.g., divisions, sections, sub-sections).
7. User opens **BOQ** for a WBS node (or project-wide view) and adds line items (description, unit, quantity, unit rate).
8. System calculates line amounts and rolls up totals automatically.
9. User opens **Estimate Summary** to review project-level and WBS-level totals.
10. User triggers **Basic Excel Export** to download the estimate for review or distribution.

### 4.2 Secondary Workflow — Return to Existing Project

1. User logs in and views the **Dashboard**.
2. User selects a project from recent projects or navigates via **Projects** list.
3. User opens **Project Details**, then continues editing **WBS**, **BOQ**, or reviewing **Estimate Summary**.
4. User exports updated data to Excel as needed.

### 4.3 Error and Edge Flows

- Invalid login credentials display a generic error without revealing whether the email exists.
- Attempting to access a project without permission returns HTTP 403 with a user-friendly message.
- Deleting a WBS node with child nodes or linked BOQ items requires confirmation and cascades per defined rules (see FR-WBS-005, FR-BOQ-006).
- Unsaved changes on navigation away from a form prompt the user to save or discard.

---

## 5. Functional Requirements

Requirements use the ID format `FR-<MODULE>-###`.

### 5.1 Login (FR-AUTH)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AUTH-001 | The system shall provide a login page accepting email and password. | Must |
| FR-AUTH-002 | The system shall validate credentials against the user store and reject invalid combinations. | Must |
| FR-AUTH-003 | Upon successful login, the system shall create a secure session and redirect to the Dashboard. | Must |
| FR-AUTH-004 | The system shall provide a logout action that terminates the session. | Must |
| FR-AUTH-005 | Unauthenticated requests to protected routes shall redirect to Login. | Must |
| FR-AUTH-006 | Passwords shall be stored using a one-way hashing algorithm (e.g., bcrypt or Argon2). | Must |
| FR-AUTH-007 | The login page shall display validation errors for empty or malformed email fields. | Should |

### 5.2 Dashboard (FR-DASH)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-DASH-001 | The Dashboard shall display a welcome message with the authenticated user's name. | Must |
| FR-DASH-002 | The Dashboard shall list the user's most recently updated projects (up to 10). | Must |
| FR-DASH-003 | The Dashboard shall show aggregate counts: total projects, active projects, and total estimate value across accessible projects. | Must |
| FR-DASH-004 | The Dashboard shall provide quick navigation to Create Project and Projects list. | Must |
| FR-DASH-005 | Clicking a project on the Dashboard shall navigate to Project Details. | Must |

### 5.3 Projects (FR-PROJ)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-PROJ-001 | The Projects module shall display a paginated table of projects accessible to the user. | Must |
| FR-PROJ-002 | The list shall show at minimum: project name, project code, client, status, last updated date, and total estimate value. | Must |
| FR-PROJ-003 | Users shall be able to search projects by name, code, or client. | Must |
| FR-PROJ-004 | Users shall be able to filter projects by status (Draft, Active, Closed). | Should |
| FR-PROJ-005 | Users with Estimator or Administrator role shall see a Create Project action. | Must |
| FR-PROJ-006 | Selecting a project row shall navigate to Project Details. | Must |

### 5.4 Create Project (FR-CPROJ)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-CPROJ-001 | The Create Project form shall capture: project name (required), project code (required, unique), client name (required), start date, end date, currency (required), description, and status (default: Draft). | Must |
| FR-CPROJ-002 | Project code shall be unique across the system and validated on submit. | Must |
| FR-CPROJ-003 | End date, if provided, shall not precede start date. | Must |
| FR-CPROJ-004 | On successful creation, the system shall assign the creating user as Project Owner and redirect to Project Details. | Must |
| FR-CPROJ-005 | The form shall display inline validation errors for required and invalid fields. | Must |
| FR-CPROJ-006 | Users with Viewer role shall not access Create Project. | Must |

### 5.5 Project Details (FR-PDET)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-PDET-001 | Project Details shall display all project metadata fields in view mode. | Must |
| FR-PDET-002 | Estimators and Administrators shall be able to edit project metadata inline or via an Edit action. | Must |
| FR-PDET-003 | Project Details shall show summary cards: total WBS nodes, total BOQ line items, and grand total estimate value. | Must |
| FR-PDET-004 | Project Details shall provide tab or sidebar navigation to WBS, BOQ, Estimate Summary, and Excel Export. | Must |
| FR-PDET-005 | Viewers shall see Project Details in read-only mode. | Must |
| FR-PDET-006 | Project status may be changed among Draft, Active, and Closed by Estimators and Administrators. | Should |

### 5.6 WBS (FR-WBS)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-WBS-001 | The WBS module shall display a hierarchical tree of work breakdown nodes for the project. | Must |
| FR-WBS-002 | Each WBS node shall have: code (required), name (required), description (optional), parent node (optional for root), and sort order. | Must |
| FR-WBS-003 | Users shall be able to add root-level and child WBS nodes. | Must |
| FR-WBS-004 | Users shall be able to edit WBS node code, name, and description. | Must |
| FR-WBS-005 | Deleting a WBS node shall require confirmation. Deletion shall cascade to child WBS nodes and associated BOQ line items. | Must |
| FR-WBS-006 | Users shall be able to reorder sibling WBS nodes (drag-and-drop or move up/down controls). | Should |
| FR-WBS-007 | Each WBS node shall display its rolled-up BOQ subtotal. | Must |
| FR-WBS-008 | WBS codes shall be unique within a project. | Must |
| FR-WBS-009 | Viewers shall have read-only access to the WBS tree. | Must |

### 5.7 BOQ (FR-BOQ)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-BOQ-001 | The BOQ module shall display line items filtered by selected WBS node, with an option to view all project line items. | Must |
| FR-BOQ-002 | Each BOQ line item shall have: item number (auto or manual), description (required), unit of measure (required), quantity (required, ≥ 0), unit rate (required, ≥ 0), and calculated amount (quantity × unit rate). | Must |
| FR-BOQ-003 | The system shall auto-calculate line amount on quantity or rate change. | Must |
| FR-BOQ-004 | Users shall be able to add, edit, and delete BOQ line items on assigned WBS nodes. | Must |
| FR-BOQ-005 | BOQ list shall support sorting by item number, description, and amount. | Should |
| FR-BOQ-006 | Deleting a BOQ line item shall require confirmation. | Must |
| FR-BOQ-007 | BOQ view shall display WBS subtotal and project grand total. | Must |
| FR-BOQ-008 | Viewers shall have read-only access to BOQ data. | Must |
| FR-BOQ-009 | Quantity and unit rate shall support up to two decimal places. | Must |

### 5.8 Estimate Summary (FR-EST)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-EST-001 | Estimate Summary shall display a hierarchical rollup of costs mirroring the WBS structure. | Must |
| FR-EST-002 | Each WBS row shall show: WBS code, WBS name, direct BOQ total, child rollup total, and combined total. | Must |
| FR-EST-003 | The summary shall display a project grand total at the top or bottom of the view. | Must |
| FR-EST-004 | Totals shall update automatically when WBS or BOQ data changes (on page load or refresh). | Must |
| FR-EST-005 | Currency shall be displayed using the project's configured currency symbol or ISO code. | Must |
| FR-EST-006 | Estimate Summary shall be read-only for all roles. | Must |
| FR-EST-007 | Users shall be able to expand and collapse WBS sections in the summary tree. | Should |

### 5.9 Basic Excel Export (FR-EXP)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-EXP-001 | Estimators and Administrators shall be able to export project estimate data to `.xlsx` from Project Details or Estimate Summary. | Must |
| FR-EXP-002 | The export shall include a **Project Info** sheet: project name, code, client, dates, currency, status, export date, and grand total. | Must |
| FR-EXP-003 | The export shall include a **WBS Summary** sheet: WBS code, name, and rolled-up total per node. | Must |
| FR-EXP-004 | The export shall include a **BOQ Detail** sheet: WBS code, WBS name, item number, description, unit, quantity, unit rate, and amount. | Must |
| FR-EXP-005 | The downloaded file name shall follow the pattern `{ProjectCode}_Estimate_{YYYYMMDD}.xlsx`. | Must |
| FR-EXP-006 | Export shall complete within 30 seconds for projects with up to 5,000 BOQ line items. | Should |
| FR-EXP-007 | Viewers shall not have access to Excel Export (unless business approves viewer export — default: no). | Must |

### 5.10 Cross-Cutting Requirements (FR-X)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-X-001 | All monetary values shall be stored and displayed with two decimal places. | Must |
| FR-X-002 | The application shall log create, update, and delete actions with user ID and timestamp (audit trail). | Should |
| FR-X-003 | The UI shall provide consistent navigation: header with app name, user menu, and module links. | Must |
| FR-X-004 | The system shall return appropriate HTTP status codes for API errors (400, 401, 403, 404, 500). | Must |
| FR-X-005 | All user-facing text shall be in English for V1. | Must |

---

## 6. Out of Scope Items

The following capabilities are explicitly **excluded** from Quantix V1. They must not appear in V1 designs, implementations, or acceptance testing.

| # | Excluded Capability | Notes |
|---|---------------------|-------|
| 1 | **AI features** | No AI-assisted pricing, description generation, or anomaly detection. |
| 2 | **Procurement** | No purchase orders, vendor management, or material requisitions. |
| 3 | **Contracts** | No contract administration, variations, or claims management. |
| 4 | **Cash Flow** | No cash flow forecasting, S-curves, or payment scheduling. |
| 5 | **PlanSwift takeoff** | No integration with PlanSwift or automated quantity takeoff import. |
| 6 | **Advanced reports** | No PDF report designer, custom report builder, or charting dashboards beyond basic Dashboard metrics. |
| 7 | **Version 2 features** | Any capability documented in the V2 roadmap (multi-currency, collaboration, templates, role-based project sharing, API integrations, etc.). |
| 8 | **User self-registration** | Users are provisioned by Administrators only. |
| 9 | **Password reset / SSO** | Out of V1 unless added by explicit change request. |
| 10 | **Offline mode** | Application requires network connectivity. |
| 11 | **Import from Excel** | V1 supports export only; import is a future enhancement. |
| 12 | **Revision history / versioning** | No estimate version snapshots or compare-in-app. |

---

## 7. Acceptance Criteria

Acceptance criteria define the conditions under which Quantix V1 is considered complete and ready for release.

### 7.1 Authentication

- [ ] Valid user can log in and reach the Dashboard within 3 seconds on a standard connection.
- [ ] Invalid credentials show an error and do not create a session.
- [ ] Logged-out user cannot access protected routes.
- [ ] Session persists across browser refresh until logout or expiry.

### 7.2 Dashboard

- [ ] Dashboard displays correct project counts and total estimate value for the logged-in user.
- [ ] Recent projects list matches the 10 most recently updated accessible projects.
- [ ] Navigation links to Projects and Create Project function correctly.

### 7.3 Projects and Create Project

- [ ] Projects list shows all accessible projects with correct metadata and totals.
- [ ] Search and filter return expected results.
- [ ] New project is created with unique code and appears in Projects list and Dashboard.
- [ ] Duplicate project code is rejected with a clear validation message.
- [ ] Viewer cannot access Create Project.

### 7.4 Project Details

- [ ] All project fields display correctly in view and edit modes.
- [ ] Summary cards reflect current WBS, BOQ, and total values.
- [ ] Navigation to WBS, BOQ, Estimate Summary, and Export is functional.

### 7.5 WBS

- [ ] User can create a multi-level WBS hierarchy (at least 4 levels deep).
- [ ] WBS codes are unique within a project.
- [ ] Deleting a parent node removes children and linked BOQ items after confirmation.
- [ ] Rolled-up subtotals on WBS nodes match sum of child BOQ amounts.

### 7.6 BOQ

- [ ] User can add, edit, and delete line items with automatic amount calculation.
- [ ] Line amounts equal quantity × unit rate for all items.
- [ ] BOQ totals match sum of line item amounts for the selected WBS scope.
- [ ] Negative quantities and rates are rejected.

### 7.7 Estimate Summary

- [ ] Summary tree mirrors WBS hierarchy.
- [ ] WBS combined totals equal direct BOQ total plus child rollup totals.
- [ ] Project grand total equals sum of all BOQ line item amounts.
- [ ] Currency displays per project configuration.

### 7.8 Basic Excel Export

- [ ] Export produces a valid `.xlsx` file openable in Excel and Google Sheets.
- [ ] File contains Project Info, WBS Summary, and BOQ Detail sheets with accurate data.
- [ ] File name follows `{ProjectCode}_Estimate_{YYYYMMDD}.xlsx` convention.
- [ ] Exported totals match in-app Estimate Summary grand total.

### 7.9 Non-Functional

- [ ] Application supports latest two versions of Chrome, Edge, and Firefox.
- [ ] No critical or high-severity security vulnerabilities in authentication or data access.
- [ ] Role-based access enforced on all modules per Section 2.

---

## 8. Sprint Breakdown

V1 delivery is organized into six two-week sprints. Sprint contents may be refined during sprint planning; module order follows dependency chain.

### Sprint 1 — Foundation and Authentication

**Goal:** Project scaffold, database schema, and working login flow.

| Deliverable | Related Requirements |
|-------------|---------------------|
| Project setup (repo, CI, environments) | FR-X-004 |
| Database schema: users, sessions, projects | FR-AUTH-006 |
| Login page and session management | FR-AUTH-001 – FR-AUTH-005 |
| Base layout shell (header, nav, user menu) | FR-X-003 |
| Seed Administrator account | FR-AUTH-002 |

**Sprint 1 exit criteria:** User can log in, see a placeholder Dashboard, and log out.

---

### Sprint 2 — Dashboard and Projects

**Goal:** Dashboard metrics and project listing.

| Deliverable | Related Requirements |
|-------------|---------------------|
| Dashboard with project counts and recent list | FR-DASH-001 – FR-DASH-005 |
| Projects list with pagination | FR-PROJ-001, FR-PROJ-002 |
| Search and status filter | FR-PROJ-003, FR-PROJ-004 |
| Role-based visibility for Create Project action | FR-PROJ-005 |

**Sprint 2 exit criteria:** Authenticated user sees Dashboard and browses Projects list with search/filter.

---

### Sprint 3 — Create Project and Project Details

**Goal:** End-to-end project creation and metadata management.

| Deliverable | Related Requirements |
|-------------|---------------------|
| Create Project form with validation | FR-CPROJ-001 – FR-CPROJ-006 |
| Project Details view and edit | FR-PDET-001 – FR-PDET-006 |
| Summary cards (placeholder totals until WBS/BOQ) | FR-PDET-003 |
| Module navigation hub on Project Details | FR-PDET-004 |

**Sprint 3 exit criteria:** Estimator can create a project, view/edit details, and navigate module tabs.

---

### Sprint 4 — WBS

**Goal:** Full hierarchical work breakdown structure.

| Deliverable | Related Requirements |
|-------------|---------------------|
| WBS tree UI (expand/collapse) | FR-WBS-001 |
| Add/edit/delete WBS nodes | FR-WBS-002 – FR-WBS-005, FR-WBS-008 |
| Sibling reorder | FR-WBS-006 |
| Rolled-up subtotal display (zero until BOQ) | FR-WBS-007 |
| Viewer read-only mode | FR-WBS-009 |

**Sprint 4 exit criteria:** User can build and manage a multi-level WBS for a project.

---

### Sprint 5 — BOQ and Estimate Summary

**Goal:** Line-item estimating and cost rollup.

| Deliverable | Related Requirements |
|-------------|---------------------|
| BOQ line-item CRUD | FR-BOQ-001 – FR-BOQ-004, FR-BOQ-006 |
| Auto-calculation of amounts | FR-BOQ-002, FR-BOQ-003 |
| BOQ sorting and subtotals | FR-BOQ-005, FR-BOQ-007 |
| Estimate Summary hierarchical rollup | FR-EST-001 – FR-EST-006 |
| Expand/collapse on summary tree | FR-EST-007 |
| Update Project Details and WBS subtotals | FR-WBS-007, FR-PDET-003 |

**Sprint 5 exit criteria:** User can enter BOQ items, see correct rollups on WBS and Estimate Summary, and verify grand total.

---

### Sprint 6 — Excel Export, Hardening, and Release

**Goal:** Export capability, QA, and release readiness.

| Deliverable | Related Requirements |
|-------------|---------------------|
| Basic Excel export (3 sheets) | FR-EXP-001 – FR-EXP-005 |
| Performance validation (≤ 5,000 lines) | FR-EXP-006 |
| Audit logging | FR-X-002 |
| Cross-browser QA | Section 7.9 |
| Security review (auth, RBAC) | Section 7.9 |
| User acceptance testing against Section 7 | All |

**Sprint 6 exit criteria:** All acceptance criteria in Section 7 pass; V1 ready for production deployment.

---

## 9. Glossary

| Term | Definition |
|------|------------|
| **BOQ** | Bill of Quantities — a structured list of work items with quantities, units, rates, and costs. |
| **WBS** | Work Breakdown Structure — a hierarchical decomposition of project work into manageable components. |
| **Estimate Summary** | A consolidated view of costs rolled up through the WBS hierarchy to a project grand total. |
| **Unit Rate** | The cost per unit of measure for a BOQ line item. |
| **Rollup** | Aggregation of child node totals into parent node totals. |

---

## 10. Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Technical Lead | | | |
| QA Lead | | | |

---

*End of Document*
