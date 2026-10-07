# Product Roadmap — Quantix

| Field | Value |
|-------|-------|
| **Document** | PRODUCT_ROADMAP |
| **Product** | Quantix |
| **Status** | Living document |
| **Last Updated** | 2026-06-26 |
| **Related** | [SRS_QUANTIX_V1.md](./SRS_QUANTIX_V1.md) · [ARCHITECTURE_V1.md](./ARCHITECTURE_V1.md) · [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) |

---

## 1. Vision

Quantix is a **cloud-based estimating platform** for construction companies, commercial teams, quantity surveyors, and estimators.

The product replaces fragmented spreadsheets and disconnected tools with a single, structured workflow — from project setup through work breakdown, bill of quantities, and consolidated cost summaries — accessible from any modern web browser.

**Long-term goal:** Become the end-to-end commercial management platform for construction, spanning estimating, procurement, contracts, cash flow, and intelligent cost analysis — while remaining modular so teams can adopt capabilities incrementally.

**V1 focus:** Deliver a stable, production-ready estimating core that teams can rely on daily before any expansion.

---

## 2. Roadmap Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              QUANTIX ROADMAP                                 │
├─────────────┬──────────────┬────────────────────┬─────────────────────────┤
│  VERSION 1  │  VERSION 1.5 │     VERSION 2      │      VERSION 3          │
│    (MVP)    │  Enhancements│  Commercial Suite  │  Intelligent Platform   │
├─────────────┼──────────────┼────────────────────┼─────────────────────────┤
│  Estimating │  Templates   │  Procurement       │  AI Estimating          │
│  Core       │  Import      │  Contracts         │  Benchmarking           │
│             │  Settings    │  Cash Flow         │  BIM / PlanSwift        │
│             │  PDF Export  │  Documents         │  Multi-company / Mobile │
└─────────────┴──────────────┴────────────────────┴─────────────────────────┘
         ▲              ▲                ▲                    ▲
         │              │                │                    │
    Production-     After V1          After V1.5           After V2
      ready         stable            stable               stable
```

| Version | Theme | Status |
|---------|-------|--------|
| **Version 1** | Estimating MVP — cloud-based core | **Pilot release** (2026-06-26) |
| **Version 1.5** | Productivity and configuration enhancements | Planned |
| **Version 2** | Commercial operations suite | Future |
| **Version 3** | Intelligent and enterprise platform | Future |

---

## 3. Version 1 (MVP)

### 3.1 Objective

Deliver a **stable cloud-based estimating application** suitable for production use. V1 is complete when teams can create projects, build estimates, review totals, and export to Excel with confidence.

**Target outcome:** A deployed, tested, production-ready product on Vercel + Supabase that quantity surveyors and estimators use as their primary estimating tool.

### 3.2 Scope

| Module | Description |
|--------|-------------|
| **Login** | Email/password authentication via Supabase Auth; session management; role-based access |
| **Dashboard** | Project overview, recent projects, aggregate statistics, quick actions |
| **Projects** | Searchable, filterable project list with pagination and status badges |
| **Create Project** | Form-driven project initialization (header + detail fields) |
| **Project Details** | Project metadata view/edit, summary cards, tab navigation to WBS, BOQ, Estimate Summary |
| **WBS** | Hierarchical Work Breakdown Structure — unlimited depth, CRUD, expand/collapse, copy/paste |
| **BOQ** | Bill of Quantities — inline editable table, rate components, automatic totals |
| **Estimate Summary** | Direct cost, indirect cost, contingency, markup, VAT, grand total; WBS rollup view |
| **Basic Excel Export** | Download `.xlsx` with Project Info, WBS Summary, and BOQ Detail sheets |

### 3.3 Technical Foundation

| Layer | Platform |
|-------|----------|
| Frontend | Vercel (Next.js App Router) |
| Authentication | Supabase Auth |
| Database | Supabase PostgreSQL |
| Access | Browser-based cloud application |

Detailed specifications: [SRS_QUANTIX_V1.md](./SRS_QUANTIX_V1.md) · [ARCHITECTURE_V1.md](./ARCHITECTURE_V1.md) · [DATABASE_DESIGN_V1.md](./DATABASE_DESIGN_V1.md) · [UI_SPEC_V1.md](./UI_SPEC_V1.md)

### 3.4 Delivery Plan

Six two-week sprints per SRS Section 8:

| Sprint | Deliverable |
|--------|-------------|
| 1 | Foundation, authentication, app shell |
| 2 | Dashboard and projects list |
| 3 | Create project and project details |
| 4 | WBS tree |
| 5 | BOQ and estimate summary |
| 6 | Excel export, QA, production release |

### 3.5 Explicitly Out of Scope (V1)

- AI features
- Procurement, contracts, cash flow
- PlanSwift or takeoff integration
- Excel import
- PDF export
- User management admin UI
- Templates and cost libraries
- Advanced reports and analytics
- Mobile-native application
- Multi-company / multi-tenant organizations
- API integrations and BIM

### 3.6 V1 Success Criteria

- [ ] All SRS Section 7 acceptance criteria pass
- [ ] Deployed to Vercel production with Supabase backend
- [ ] Zero critical bugs in core estimating workflow
- [ ] Estimators can complete full workflow: Create Project → WBS → BOQ → Summary → Export
- [ ] Role-based access enforced (Administrator, Estimator, Viewer)
- [ ] Tagged release: `v1.0.0`

---

## 4. Version 1.5

### 4.1 Objective

Enhance the V1 estimating core with **productivity, configuration, and output improvements** — without introducing new commercial domains (procurement, contracts, cash flow).

**Prerequisite:** Version 1 completed, tested, and production-ready.

### 4.2 Possible Enhancements

| Feature | Description | Value |
|---------|-------------|-------|
| **Excel Import** | Import BOQ line items and WBS structure from `.xlsx` templates | Reduces manual data entry for teams migrating from spreadsheets |
| **Company Settings** | Organization profile, default currency, date formats, branding | Centralizes configuration currently scattered or hard-coded |
| **User Management** | Admin UI to create, edit, deactivate users and assign roles | Removes need for manual Supabase Auth provisioning |
| **BOQ Templates** | Reusable BOQ line-item sets applied to new projects | Accelerates estimate setup for recurring project types |
| **WBS Templates** | Reusable WBS hierarchies applied to new projects | Standardizes work breakdown across the organization |
| **Cost Libraries** | Shared rate libraries (material, labor, equipment, subcontract) linked to BOQ items | Consistent pricing across projects and estimators |
| **Better Dashboard** | Charts, trend lines, project pipeline view, estimator workload | Improved visibility for managers and commercial leads |
| **PDF Export** | Formatted estimate report export alongside Excel | Professional client-facing deliverables |

### 4.3 V1.5 Principles

- **Additive only** — no breaking changes to V1 database schema or workflows
- **Optional adoption** — teams can ignore templates/libraries until ready
- **Same platform** — remains Vercel + Supabase; no architecture pivot
- **Prioritization TBD** — features listed are candidates; final V1.5 scope set after V1 launch feedback

### 4.4 V1.5 Success Criteria

- [ ] V1 remains fully functional with no regressions
- [ ] At least 3 of 8 enhancement areas delivered based on user feedback priority
- [ ] Database migrations backward compatible with V1 data
- [ ] Tagged release: `v1.5.0`

---

## 5. Version 2

### 5.1 Objective

Expand Quantix from an **estimating tool** into a **commercial operations suite** — connecting estimates to procurement, contracts, cost tracking, and cash flow.

**Prerequisite:** Version 1.5 stable in production (or V1 stable if V1.5 is deferred based on market priority).

### 5.2 Future Modules

| Module | Description |
|--------|-------------|
| **Procurement** | End-to-end procurement workflow from estimate to purchase |
| **Contracts** | Contract administration, values, and status tracking |
| **Variation Orders** | Manage contract variations linked to WBS/BOQ |
| **Purchase Requests** | Internal requests for materials and services |
| **Purchase Orders** | Formal PO issuance to suppliers |
| **Supplier Database** | Vendor registry with contact, trade, and performance data |
| **Cost Tracking** | Actual costs vs estimated costs per WBS/BOQ line |
| **Cash Flow** | Payment schedules, S-curves, and cash flow forecasting |
| **Document Attachments** | File uploads (drawings, specs, quotes) linked to projects and BOQ items |
| **Notifications** | In-app and email alerts for approvals, variations, and deadlines |

### 5.3 V2 Architecture Approach

V2 modules attach to the V1 foundation via new database tables with foreign keys to `projects` — no restructuring of V1 schema. See [DATABASE_DESIGN_V1.md](./DATABASE_DESIGN_V1.md) Section 8 (Future Scalability).

```
projects (V1 — unchanged)
  ├── wbs, boq_items, estimate_summary (V1)
  ├── procurement_orders, purchase_requests (V2)
  ├── contracts, variations (V2)
  ├── cash_flow_periods (V2)
  ├── suppliers (V2)
  ├── project_documents (V2)
  └── notifications (V2)
```

### 5.4 V2 Principles

- **Estimate remains the cost source** — BOQ line items are the authoritative direct-cost data; V2 modules reference, not duplicate
- **Modular activation** — organizations enable modules they need; estimating works standalone
- **Enterprise workflows** — approval chains, audit trails, and role expansion for commercial teams
- **Document storage** — Supabase Storage for attachments

### 5.5 Explicitly Out of Scope (V2)

- AI-assisted estimating
- BIM integration
- PlanSwift takeoff integration
- Multi-company platform
- Mobile-native application
- Public API for third-party integrations

### 5.6 V2 Success Criteria

- [ ] Procurement workflow connects estimate BOQ items to purchase orders
- [ ] Contract values reconcile with estimate summary totals
- [ ] Cash flow baseline derived from estimate grand total
- [ ] Cost tracking shows estimate vs actual per WBS node
- [ ] V1 and V1.5 features remain fully functional
- [ ] Tagged release: `v2.0.0`

---

## 6. Version 3

### 6.1 Objective

Transform Quantix into an **intelligent, enterprise-grade platform** with AI-assisted estimating, predictive analytics, deep integrations, and multi-organization support.

**Prerequisite:** Version 2 stable in production with sufficient historical project data to power analytics and AI features.

### 6.2 Future Intelligent Features

| Feature | Description |
|---------|-------------|
| **AI-assisted estimating** | LLM-powered suggestions for BOQ descriptions, rates, and missing line items |
| **AI quantity suggestions** | Intelligent quantity recommendations based on project parameters |
| **Historical cost analysis** | Trend analysis across completed projects and estimate versions |
| **Cost benchmarking** | Compare project costs against portfolio averages and industry benchmarks |
| **Forecasting** | Predict final project costs based on progress and historical patterns |
| **Risk analysis** | Identify cost overrun risk based on estimate composition and market data |
| **Multi-company support** | Platform-level organization isolation with cross-company admin |
| **Mobile application** | Native or PWA mobile app for site review and approvals |
| **API integrations** | Public REST/GraphQL API for ERP, accounting, and project management tools |
| **BIM integration** | Import quantities and elements from BIM models (IFC, Revit) |
| **PlanSwift integration** | Direct takeoff import from PlanSwift into BOQ line items |

### 6.3 V3 Architecture Considerations

| Area | Direction |
|------|-----------|
| AI | External LLM API with staging/approval workflow; no auto-commit of AI suggestions |
| Analytics | Data warehouse or materialized views over historical project data |
| Multi-company | Organization table as root entity; RLS policies scoped to `organization_id` |
| Mobile | React Native or PWA with shared API layer |
| Integrations | Versioned public API with authentication, rate limiting, and webhooks |
| BIM / PlanSwift | Import pipeline with mapping UI; quantities flow into existing BOQ schema |

### 6.4 V3 Principles

- **Human in the loop** — AI suggestions require estimator review and approval before persistence
- **Data-driven** — analytics quality depends on V1/V2 data discipline; no AI without clean historical data
- **Open platform** — API-first for enterprise customers with existing toolchains
- **Global scale** — multi-company, multi-currency, multi-region readiness

### 6.5 V3 Success Criteria

- [ ] AI suggestions measurably reduce estimate preparation time
- [ ] Benchmarking available across 50+ completed projects
- [ ] PlanSwift or BIM import populates BOQ with mapped quantities
- [ ] Public API documented and used by at least one integration partner
- [ ] Multi-company deployment with isolated data per organization
- [ ] Tagged release: `v3.0.0`

---

## 7. Version Comparison

| Capability | V1 | V1.5 | V2 | V3 |
|------------|:--:|:----:|:--:|:--:|
| Login and roles | ✓ | ✓ | ✓ | ✓ |
| Dashboard | ✓ | Enhanced | ✓ | ✓ |
| Projects and WBS/BOQ | ✓ | ✓ | ✓ | ✓ |
| Estimate Summary | ✓ | ✓ | ✓ | ✓ |
| Excel export | ✓ | ✓ | ✓ | ✓ |
| Excel import | | ✓ | ✓ | ✓ |
| PDF export | | ✓ | ✓ | ✓ |
| Templates and libraries | | ✓ | ✓ | ✓ |
| User management UI | | ✓ | ✓ | ✓ |
| Company settings | | ✓ | ✓ | ✓ |
| Procurement | | | ✓ | ✓ |
| Contracts and variations | | | ✓ | ✓ |
| Cash flow | | | ✓ | ✓ |
| Cost tracking | | | ✓ | ✓ |
| Documents and notifications | | | ✓ | ✓ |
| AI estimating | | | | ✓ |
| Benchmarking and forecasting | | | | ✓ |
| BIM / PlanSwift | | | | ✓ |
| Multi-company | | | | ✓ |
| Mobile app | | | | ✓ |
| Public API | | | | ✓ |

---

## 8. Product Principles

These principles apply across all versions and guide every scope and architecture decision.

| Principle | Meaning for Quantix |
|-----------|-------------------|
| **Cloud-first** | Browser-accessible, hosted on Vercel + Supabase; no desktop-only or local-first design |
| **Modular** | Each version adds self-contained modules that attach to the project core without breaking prior versions |
| **Enterprise-ready** | Role-based access, audit trails, data isolation, and professional output from V1 onward; expanded in V2/V3 |
| **Scalable** | PostgreSQL relational model, additive schema, serverless frontend — scales with project and user growth |
| **Secure** | Supabase Auth, RLS policies, HTTPS, no secrets in client code; security review at every major release |
| **Maintainable** | Sprint-based delivery, strict TypeScript, conventional commits, comprehensive documentation, no speculative code |

---

## 9. Development Rules

| # | Rule |
|---|------|
| 1 | **Version 1 must be completed, tested, and production-ready** before any Version 1.5 or Version 2 features are implemented. |
| 2 | **Version 1.5 must not break V1** — all V1 workflows and data remain functional after V1.5 releases. |
| 3 | **Version 2 modules attach additively** — no restructuring of V1 database tables. |
| 4 | **Version 3 features require sufficient data volume** — AI and analytics are not built until V1/V2 data exists. |
| 5 | **One version focus at a time** — the team does not parallelize across major versions. |
| 6 | **Scope changes require roadmap update** — this document is updated when features move between versions. |
| 7 | **User feedback drives V1.5 priority** — enhancement order is set after V1 launch, not before. |
| 8 | **No roadmap feature ships without documentation** — SRS or equivalent spec before implementation. |

Development process details: [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)

---

## 10. Timeline (Indicative)

Timelines are estimates and adjust based on team size and V1 launch feedback. Not commitments.

| Phase | Duration (estimate) | Milestone |
|-------|-------------------|-----------|
| **V1 development** | 12 weeks (6 sprints × 2 weeks) | `v1.0.0` production release |
| **V1 stabilization** | 4–8 weeks post-launch | Bug fixes, performance, user feedback collection |
| **V1.5 development** | 8–12 weeks | `v1.5.0` release |
| **V2 development** | 6–9 months | `v2.0.0` release (phased module rollout) |
| **V3 development** | 9–12 months | `v3.0.0` release (phased capability rollout) |

```
2026 Q3-Q4          2027 Q1-Q2         2027 Q3-2028          2028+
├──────────────────┼──────────────────┼─────────────────────┼──────►
│   V1 MVP         │  V1.5 Enhance    │   V2 Commercial     │  V3
│   Production     │  Templates       │   Procurement       │  AI
│                  │  Import/Export   │   Contracts         │  BIM
│                  │  Settings        │   Cash Flow         │  Mobile
```

---

## 11. Documentation Index

| Document | Version | Purpose |
|----------|---------|---------|
| [SRS_QUANTIX_V1.md](./SRS_QUANTIX_V1.md) | V1 | Functional requirements and acceptance criteria |
| [ARCHITECTURE_V1.md](./ARCHITECTURE_V1.md) | V1 | Cloud architecture and deployment |
| [DATABASE_DESIGN_V1.md](./DATABASE_DESIGN_V1.md) | V1 | PostgreSQL schema and relationships |
| [UI_SPEC_V1.md](./UI_SPEC_V1.md) | V1 | UI/UX specification and design system |
| [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) | V1 | Development rules, folder structure, sprint workflow |
| PRODUCT_ROADMAP.md | All | This document — version scope and sequencing |

Future versions will receive their own SRS, architecture, and database documents before development begins.

---

## 12. Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Technical Lead | | | |
| Stakeholder | | | |

---

*End of Document*
