# Quantix V1 — User Guide

| Field | Value |
|-------|-------|
| **Product** | Quantix Version 1 (Pilot) |
| **Audience** | Quantity Surveyors, Estimators, Commercial Engineers, Admins |
| **Last Updated** | 2026-06-26 |
| **Related** | [PILOT_TEST_GUIDE.md](./PILOT_TEST_GUIDE.md) · [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md) · [AUTHORIZATION_V1.md](./AUTHORIZATION_V1.md) |

This guide walks you through Quantix V1 from your first login to exporting a final estimate. Steps are numbered. Tips and warnings are marked throughout.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Login](#2-login)
3. [Dashboard](#3-dashboard)
4. [Company Settings](#4-company-settings)
5. [Resource Library](#5-resource-library)
6. [Create Project](#6-create-project)
7. [WBS](#7-wbs)
8. [BOQ](#8-boq)
9. [Rate Analysis](#9-rate-analysis)
10. [Estimate Summary](#10-estimate-summary)
11. [AI Estimator](#11-ai-estimator)
12. [Executive Dashboard](#12-executive-dashboard)
13. [Historical Benchmark](#13-historical-benchmark)
14. [Export and Reports](#14-export-and-reports)
15. [Audit History](#15-audit-history)
16. [Common Issues](#16-common-issues)
17. [Best Practice Workflow](#17-best-practice-workflow)
18. [Quick Start Guide](#18-quick-start-guide-10-minutes)
19. [Glossary](#19-glossary)

---

## 1. Introduction

### What is Quantix V1?

Quantix is a **cloud-based construction estimating platform**. It helps your team build structured estimates using:

- A **Work Breakdown Structure (WBS)** to organize work by discipline or area
- A **Bill of Quantities (BOQ)** to list items, quantities, and unit rates
- An **Estimate Summary** that rolls up direct cost, overhead, profit, tax, and grand total
- **Exports** to Excel and print-ready PDF layouts

Quantix runs in your web browser. There is nothing to install on your computer.

[Screenshot: Quantix application shell with sidebar and project open]

### Who should use it?

| Role | Typical use |
|------|-------------|
| **Estimator** | Create and edit projects, WBS, BOQ, and estimates |
| **Quantity Surveyor (QS)** | Review and maintain estimates across multiple projects |
| **Commercial Engineer** | Review totals, exports, and portfolio analytics |
| **Admin** | Company settings, resource library, benchmarks |
| **Viewer** | Read-only access to review estimates |

### Basic workflow overview

Most estimating work follows this path:

```
Login → Dashboard / Projects → Create or open project
  → WBS (structure) → BOQ (quantities & rates)
  → Rate Analysis (optional detail) → Estimate Summary (totals)
  → Validation → Export Excel / Print PDF
```

> **Tip:** Admins should configure **Company Settings** and the **Resource Library** once before estimators start new projects. See [Section 17](#17-best-practice-workflow).

---

## 2. Login

### How to sign in

1. Open your Quantix URL in a supported browser (Chrome or Edge recommended).
2. You will land on the **Login** page (`/login`).

[Screenshot: Login Page]

3. Enter your **email address**.
4. Enter your **password**.
5. Click **Sign In**.
6. If your credentials are correct, you are redirected to the **Executive Dashboard** (`/dashboard`).
7. Your name and role appear in the header user menu.

> **Tip:** Use the eye icon next to the password field to show or hide your password while typing.

> **Warning:** After several failed attempts, wait a moment before trying again. Repeated failures may temporarily lock your account (depending on your administrator’s Supabase settings).

### Forgot password

1. On the login page, click **Forgot password?**
2. A dialog explains the current process.

> **Note:** Self-service password reset is **not available in V1**. Contact your **administrator** to reset your password in Supabase Auth.

[Screenshot: Forgot Password Dialog]

### User roles and permissions

Your administrator assigns one role when your account is created:

| Role | What you can generally do |
|------|---------------------------|
| **Super Admin** | Full access to all modules and projects |
| **Admin** | Manage company settings, resource library, benchmarks; full project access |
| **Estimator** | Create and edit **your own** projects (WBS, BOQ, summary, export) |
| **Quantity Surveyor** | View and edit **all** projects; export estimates |
| **Viewer** | Read-only — no editing, no export |

**Common restrictions:**

- **Viewers** cannot create projects, edit BOQ, or export Excel.
- **Estimators** cannot edit projects created by other users (unless your admin has changed ownership).
- **Admin routes** (`/admin/settings`, `/admin/benchmarks`, `/admin/uat`) are limited to Admin and Super Admin.

For the full permission matrix, see [AUTHORIZATION_V1.md](./AUTHORIZATION_V1.md).

### Log out

1. Click your **name** in the top-right header.
2. Select **Log out**.
3. You return to the login page.

---

## 3. Dashboard

Quantix provides two main entry views:

- **Executive Dashboard** (`/dashboard`) — portfolio KPIs, charts, and filters
- **Projects list** (`/projects`) — searchable table of all your accessible projects

Use the **sidebar** to switch between **Dashboard** and **Projects**.

[Screenshot: Sidebar Navigation]

### Executive Dashboard — KPI cards

After login, the **Executive Dashboard** shows portfolio-level metrics, including:

- Total projects and active estimates
- Combined direct cost and grand total (where currency is consistent)
- Status distribution across the portfolio

[Screenshot: Executive Dashboard KPI Cards]

**How to read KPI cards:**

1. Each card shows a **label** (what is measured) and a **value** (number or currency).
2. Values reflect the projects matching your current **filters** (see below).
3. If projects use mixed currencies, a **warning banner** appears — totals may not be directly comparable.

### How to use filters

1. On the dashboard, locate the **filter bar** below the page title.
2. Optionally set:
   - **Search** — project name or code
   - **Client**
   - **Location**
   - **Estimator**
   - **Status** — Draft, In Progress, For Review, Approved, Archived
   - **Date range** — from / to
3. Filters apply automatically as you change them (the page reloads with updated results).
4. To clear filters, reset each field or remove search terms.

[Screenshot: Dashboard Filters Bar]

### How to open projects

**From the dashboard:**

1. Scroll to the **Portfolio Projects** table.
2. Click a **project row** to open its **Overview** tab.

**From the Projects list:**

1. Click **Projects** in the sidebar.
2. Use **Search**, **Status filter**, or **Sort** in the toolbar.
3. Click a row to open the project.

[Screenshot: Projects List with Search and Filters]

> **Tip:** Use **+ Create Project** (top-right on Dashboard or Projects page) if your role allows project creation.

---

## 4. Company Settings

**Route:** `/admin/settings`  
**Who can edit:** Admin and Super Admin only

Configure your company profile once. New projects inherit these defaults.

[Screenshot: Company Settings Page]

### Company profile

1. Go to **Company Settings** in the sidebar (admin only).
2. Edit **Company name**, **Address**, **Phone**, **Email**, and **Website**.
3. Click **Save**.

These details appear on exports, print views, and the sidebar.

### Logo

1. Enter a **Logo URL** (publicly accessible image link, e.g. `https://yoursite.com/logo.png`).
2. Save.
3. The logo appears in the sidebar and on printed/exported reports.

> **Warning:** The logo must be a valid HTTPS URL. Broken links show a blank space.

### Currency

1. Set **Default currency** (e.g. PHP, USD).
2. Save.
3. **New projects** inherit this currency. Existing projects keep their own setting (editable on Project Overview).

### VAT, OCM, Contingency, and Profit

| Setting | Meaning |
|---------|---------|
| **Default VAT %** | Value-added tax applied at summary level |
| **Default OCM %** | Indirect cost / overhead (shown as **Indirect Cost** on summary) |
| **Default Contingency %** | Risk allowance |
| **Default Profit %** | Markup / profit (shown as **Markup** on summary) |

1. Enter percentages for each field.
2. Save.
3. New projects start with these values on the **Estimate Settings** section of Project Overview.

### Report settings

1. **Report header** — text at the top of printed and exported reports.
2. **Report footer** — text at the bottom (page numbers may also appear).
3. **Signature block** — names/titles for bid documents.
4. **Theme color** — accent color for charts and Excel headers.
5. Save after editing.

[Screenshot: Report Header and Footer Fields]

> **Tip:** After changing branding, export a test Excel file from a sample project to confirm layout.

---

## 5. Resource Library

**Route:** `/admin/resource-library` (sidebar → **Resource Library**)  
**Who can edit:** Admin and Super Admin  
**Who can browse:** All authenticated users

The resource library stores standard **materials, labor, equipment, and subcontract** rates used in rate analysis.

[Screenshot: Resource Library Navigation Tabs]

### Browse categories

Use the sub-navigation to open each catalog:

| Tab | Contents |
|-----|----------|
| **Materials** | Material codes, units, rates |
| **Labor** | Labor types and hourly/daily rates |
| **Equipment** | Plant and equipment rates |
| **Subcontract** | Subcontract package rates |
| **Suppliers** | Supplier directory |
| **Units** | Unit of measure definitions |
| **Categories** | Resource grouping |

### Add a resource

1. Open the relevant tab (e.g. **Materials**).
2. Click **Add** (or equivalent add button on the page).
3. Fill in **Code**, **Description**, **Unit**, **Rate**, and other required fields.
4. Save.

### Edit a resource

1. Find the row in the table.
2. Click **Edit** (or open the row editor).
3. Update fields.
4. Save.

### Delete a resource

1. Select the resource.
2. Click **Delete**.
3. Confirm when prompted.

> **Warning:** Deleting a resource does not remove it from existing rate analysis lines on BOQ items, but it may affect future library lookups.

### Import resources

1. On a library tab, click **Import**.
2. Prepare a **CSV file** matching the expected column format (see on-screen hints or export a sample first).
3. Select the file and confirm import.
4. Review imported rows for errors.

[Screenshot: Resource Library Import Dialog]

### Export resources

1. Click **Export** on the library tab.
2. Choose **CSV** or **Excel** if offered.
3. Save the downloaded file for backup or editing offline.

> **Tip:** Export before bulk import so you have a backup.

### Project-level Rate Library tab

Inside a project, the **Rate Library** tab shows the same company library in project context. Editing requires **Admin** role; estimators use resources when building rate analysis on BOQ lines.

---

## 6. Create Project

**Route:** `/projects/new`

### Who can create projects

Estimator, Quantity Surveyor, Admin, and Super Admin. Viewers are blocked.

### Project information

1. Click **+ Create Project** from the Dashboard or Projects page.
2. Fill in the form:

[Screenshot: Create Project Form]

| Field | Required | Notes |
|-------|----------|-------|
| **Project Name** | Yes | Descriptive title |
| **Client** | Yes | Client or owner name |
| **Location** | No | Site or city |
| **Description** | No | Scope notes |
| **Project Code** | Auto | Generated on save as `QTX-YYYY-######` |
| **Status** | Auto | Starts as **Draft** |

3. Click **Create Project**.
4. You are redirected to the project **Overview** tab.

### Client information (extended)

On **Project Overview**, you can add more client-related fields after creation:

1. Open the project → **Overview** tab.
2. Edit **Owner**, **Consultant**, **Contractor**, and related metadata.
3. Click **Save Changes**.

### Estimate settings

Estimate settings live on the **Overview** tab under estimate / financial fields:

1. Set **Currency**, **VAT %**, **Indirect Cost (OCM) %**, **Contingency %**, **Markup (Profit) %**.
2. Configure **Measurement system**, **Rounding rule**, and **Unit system** if needed.
3. Save.

> **Tip:** If your admin configured Company Settings, new projects already have sensible defaults — adjust only when this project differs.

### Save project

- **Create Project** saves immediately on the new-project form.
- On **Overview**, click **Save Changes** after any edit.
- Status transitions (Start, Submit, Approve) use dedicated buttons — see project lifecycle in [PROJECT_LIFECYCLE_V1.md](./PROJECT_LIFECYCLE_V1.md).

[Screenshot: Project Overview with Estimate Settings]

---

## 7. WBS

**Route:** `/projects/[projectId]/wbs`  
**Tab:** **WBS**

The WBS organizes your estimate into a hierarchy (e.g. Structural → Concrete → Footings).

[Screenshot: WBS Tree View]

### Add root level

1. Open the project → **WBS** tab.
2. Click **Add Root Level**.
3. Enter a **Description** (e.g. "Structural Works").
4. Confirm — Quantix assigns a WBS code automatically.
5. The node appears at the top level of the tree.

### Add child level

**Option A — Toolbar**

1. Select a parent node in the tree.
2. Click **Add Root Level** dropdown alternative or use **Insert** shortcut (see below).

**Option B — Context / selection**

1. Click a parent node to select it.
2. Press **Insert** on your keyboard *or* use the add-child control on the node.
3. Enter the child **Description**.
4. Confirm.

### Rename

1. Select a node.
2. Press **F2** *or* use the edit/rename action on the node.
3. Change the **Description** (and code if permitted).
4. Save.

### Delete

1. Select a node.
2. Press **Delete** *or* use the delete action.
3. Review the impact dialog (child nodes and linked BOQ items may block deletion).
4. Confirm if allowed.

> **Warning:** You cannot delete a node that has children or BOQ items until those are removed or reassigned.

### Expand / collapse

1. Click the **arrow** (chevron) next to a parent node to expand or collapse its children.
2. Collapsing hides children but does not delete them.

### Drag and drop

1. Click and **drag** a node row.
2. Drop it onto another node to change **parent** or **order** within the tree.
3. Wait for the save confirmation message.

[Screenshot: WBS Drag and Drop]

> **Tip:** You cannot drop a node onto its own descendant — the move will be rejected.

### Copy / paste branch

1. Select a node.
2. Press **Ctrl+C** (copy) — copies the branch and descendants.
3. Select a target parent (or root area).
4. Press **Ctrl+V** or click **Paste Branch**.
5. A copy of the branch is created under the target.

### Search WBS

1. Use the **Search WBS code or description** box at the top.
2. Type part of a code or description (search is debounced).
3. Click a **search result** to jump to and expand that node.

[Screenshot: WBS Search Results]

**Keyboard shortcuts summary:**

| Shortcut | Action |
|----------|--------|
| Insert | Add child to selected node |
| F2 | Rename selected node |
| Delete | Delete selected node |
| Ctrl+C | Copy branch |
| Ctrl+V | Paste branch |
| Drag row | Move branch |

---

## 8. BOQ

**Route:** `/projects/[projectId]/boq`  
**Tab:** **BOQ**

The BOQ is your quantity schedule — each line has a unit, quantity, rates, and calculated amount.

[Screenshot: BOQ Grid]

### Add BOQ item

1. Open **BOQ** tab.
2. Click **Add Item**.
3. A new row appears — link it to a **WBS node**, enter **Description**, **Unit**, **Quantity**, and rates.
4. Changes save automatically (short debounce) or when you tab out of the cell.

### Edit quantity

1. Click the **Quantity** cell.
2. Enter a number.
3. Tab out or click elsewhere — **Total Amount** recalculates as Quantity × Total Rate.

### Edit unit

1. Click the **Unit** cell.
2. Enter or select the unit (e.g. `m2`, `m3`, `lot`, `kg`).

### Edit rates

Each BOQ line has five rate columns:

| Column | Meaning |
|--------|---------|
| **Material** | Material cost per unit |
| **Labor** | Labor cost per unit |
| **Equipment** | Equipment cost per unit |
| **Subcontract** | Subcontract cost per unit |
| **Other** | Other cost per unit |

1. Click a rate cell and enter a value.
2. **Total Rate** = Material + Labor + Equipment + Subcontract + Other.
3. **Total Amount** = Quantity × Total Rate.

> **Example:** Material 100 + Labor 50 + Equipment 25 + Subcontract 10 + Other 5 = **Total Rate 190**. Quantity 10 → **Total Amount 1,900.00**.

### Copy / paste from Excel

Quantix supports pasting tabular data from Excel:

1. In Excel, copy rows (Ctrl+C) including columns in BOQ order.
2. In Quantix BOQ grid, select the target area or row.
3. Press **Ctrl+V** to paste.
4. Review imported values — invalid rows show a status message.

You can also use toolbar **Copy** and **Paste** for rows within Quantix.

> **Tip:** The footer hint reads: *Paste Excel rows from clipboard · Ctrl+C/V copy/paste*.

> **Warning:** Pasting does not replace a full Excel import of an entire project — it adds or updates grid rows only.

### Filter by WBS

1. Open the **WBS filter** dropdown above the grid.
2. Select a WBS node — only items linked to that node (per filter rules) are shown.
3. Select **All WBS nodes** to clear the filter.

### Search items

1. Use the **Search items** box.
2. Type an item code or description fragment.
3. The grid filters to matching rows.

### Delete item

1. Select one or more rows (checkboxes).
2. Click **Delete**.
3. Confirm — direct cost on Estimate Summary decreases accordingly.

### Check totals

1. Review the **Total Rate** and **Total Amount** columns on each row.
2. Open **Estimate Summary** — **Direct Cost** should equal the sum of all BOQ **Total Amount** values.
3. Use the **Validation** tab to confirm calculations match (see Section 10).

**Other BOQ tools:**

| Tool | Purpose |
|------|---------|
| **Undo / Redo** | Reverse recent grid edits |
| **Duplicate** | Copy a single selected row |
| **Calculator** | In-grid calculation helper (where shown) |

[Screenshot: BOQ Toolbar with Add, Copy, Paste, Delete]

---

## 9. Rate Analysis

Rate analysis breaks down a BOQ unit rate into detailed resource lines (materials, labor, etc.).

### Open rate analysis

1. Go to **BOQ** tab.
2. On a BOQ row, click the **rate analysis** control (chart/table icon in the row actions).
3. The **Rate Analysis** dialog opens for that line.

[Screenshot: Rate Analysis Dialog]

### Add resources

1. In the dialog, choose category tab: **Material**, **Labor**, **Equipment**, or **Subcontract**.
2. Click **Add line** or pick from the **resource library**.
3. Select a library resource — code, description, and unit fill automatically.

### Input consumption

1. In the **Qty** (consumption) column, enter how much of the resource is used **per unit of BOQ measure**.
2. Line amount = Consumption × Rate (adjusted for waste/productivity where applicable).

### Waste %

1. Enter **Waste %** on a material line where spoilage applies.
2. The effective quantity increases accordingly in the line calculation.

### Productivity

1. Enter **Productivity** where output per unit time affects the rate (e.g. m² per day).
2. Leave blank if not used for that line.

### Save and update BOQ

1. Edit lines in the rate analysis spreadsheet.
2. Changes save as you work (or use the dialog save action if shown).
3. **Category totals** roll up to the BOQ **Material / Labor / Equipment / Subcontract** rate columns.
4. Close the dialog — BOQ **Total Rate** and **Total Amount** update.

> **Tip:** Use **Sync from library** (if shown) after updating a resource rate in the company library to refresh analysis lines.

> **Warning:** **Manual overrides** on BOQ rate columns may diverge from rate analysis until you sync or clear overrides.

---

## 10. Estimate Summary

**Route:** `/projects/[projectId]/summary`  
**Tab:** **Estimate Summary**

[Screenshot: Estimate Summary Page]

### Direct cost

**Direct Cost** is the sum of every BOQ line **Total Amount**. It represents construction cost before project overhead and tax.

### OCM (Indirect Cost)

**Indirect Cost** (OCM — Overhead & Construction Management) = Direct Cost × OCM %.

Set OCM % on Project Overview or edit markups on the summary page (if your role allows).

### Contingency

**Contingency** = applied after indirect cost, using your **Contingency %** setting. It covers risk and unknowns.

### Profit (Markup)

**Markup** (Profit) = applied after contingency, using your **Markup / Profit %**.

### VAT

**VAT** = applied after markup, using your **VAT %**.

### Grand total

**Grand Total** is the final bid figure including all markups and tax.

**Calculation chain:**

```
Direct Cost
  + Indirect Cost (OCM)
  + Contingency
  + Markup (Profit)
  + VAT
= Grand Total
```

See [COST_STRUCTURE_V1.md](./COST_STRUCTURE_V1.md) for exact formulas.

### Charts

The summary page includes charts such as:

- **Cost breakdown** donut — share of direct, indirect, contingency, markup, VAT
- **WBS rollup** — cost by WBS branch
- **Monthly cash** — illustrative spread (placeholder data in V1 pilot)

[Screenshot: Estimate Summary Charts]

> **Note:** The monthly cash chart uses equal monthly spread placeholder data — not a detailed cash flow schedule. See [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md).

### Bid summary

The **Bid Summary** panel shows client-facing totals with company branding (from Company Settings):

- Project name, client, location
- Prepared by, estimate date
- Direct cost through grand total
- Signature block (if configured)

### Refresh totals

1. After BOQ changes, click **Refresh** on the summary page if totals look stale.
2. Validation score updates on the **Validation** tab.

### Edit markups on summary

If you are Admin or Estimator (per permissions):

1. Edit percentage fields on the summary page.
2. Save — totals recalculate immediately.

---

## 11. AI Estimator

**Route:** `/projects/[projectId]/ai-estimator`  
**Tab:** **AI Estimator**

The AI Estimator suggests WBS and BOQ items from a **text description** of the project using engineering formula templates.

> **Note:** This is a **rule-based knowledge engine**, not a chatbot. It does not use external AI APIs for inference in V1.

[Screenshot: AI Estimator Page]

### Enter project description

1. Open **AI Estimator** tab.
2. In the description box, describe the building or works, for example:

   *"5-storey office building, 2 basement levels, GFA 12,000 m², RC frame, curtain wall facade."*

3. Include building type, storeys, basement levels, and approximate GFA where possible.

### Generate WBS / BOQ

1. Click **Generate estimate plan** (or equivalent generate button).
2. Wait for processing — a plan appears with suggested **WBS nodes** and **BOQ lines** with quantities and formulas.

[Screenshot: AI Estimator Generated Plan]

### Review AI suggestions

1. Expand each suggested section.
2. Read **explanations** — each quantity shows the formula used (e.g. concrete volume, rebar weight).
3. Check units and rates — defaults may need adjustment.

### Edit quantities

1. Before applying, edit suggested quantities or descriptions in the preview where editable fields are shown.
2. Remove items that do not apply to your project.

### Check explanations

1. Each line links to an engineering module (e.g. Concrete, Rebar, Formwork).
2. Verify assumptions (thickness, cover, storey height) match your project.

### Apply to project

1. When satisfied, click **One-click apply to project**.
2. Quantix creates WBS nodes and BOQ items on the current project.
3. Open **WBS** and **BOQ** tabs to review and refine.

> **Warning:** Always review AI output before submitting for approval — suggested rates may use library defaults.

> **Tip:** Viewers cannot use the AI Estimator. Estimators and QS can.

---

## 12. Executive Dashboard

**Route:** `/dashboard`

The Executive Dashboard is the portfolio home page for analytics across all accessible projects.

[Screenshot: Full Executive Dashboard]

### Project KPIs

Review KPI cards at the top:

- Project counts by activity
- Portfolio direct cost and grand total
- Average estimate values (where applicable)

### Cost analytics

Scroll to **Portfolio Charts**:

- Status distribution (Draft through Archived)
- Cost category breakdown across the portfolio
- Client or location distribution (where shown)

Charts respect your active **filters**.

### AI insights

The **AI Insights** panel highlights portfolio patterns — for example concentration of cost in certain categories or statuses worth attention.

[Screenshot: AI Insights Panel]

> **Note:** Insights are derived from portfolio data rules, not generative AI text.

### Reports

1. Use the **Executive Reports** toolbar on the dashboard.
2. **Export to Excel** — downloads a workbook with KPI and portfolio sheets.
3. **Print** — opens `/dashboard/print` for a print-friendly layout.

[Screenshot: Executive Reports Toolbar]

---

## 13. Historical Benchmark

**Route:** `/admin/benchmarks`  
**Who can access:** Admin and Super Admin

Compare current estimating accuracy against **completed historical projects** (benchmark archive).

[Screenshot: Historical Benchmark Dashboard]

### Import historical data

1. Go to **Admin → Benchmarks** → **Data Import** tab.
2. Prepare an Excel (`.xlsx`) or CSV file with sheets/sections: **Metadata**, **WBS**, **BOQ**, **Summary**, and actuals.
3. Click **Choose file** and submit.
4. Quantix creates a benchmark project with estimated and actual values.

> **Tip:** Run `npm run demo:historical-benchmarks` (admin/dev) to generate sample seed SQL for five archetype projects.

### Compare estimate vs benchmark

1. Open **Benchmarks** → **Validation Center** tab.
2. Select a benchmark project from the dropdown.
3. Review each BOQ line:

   | Column | Meaning |
   |--------|---------|
   | Est Qty / Act Qty | Estimated vs actual quantity |
   | Est Rate / Act Rate | Estimated vs actual unit rate |
   | Est Cost / Awarded | Estimated cost vs awarded cost |
   | Variance % | Percentage difference |

4. Read **automatic findings** for overruns and savings.

### Review variances

1. Open **Accuracy Dashboard** tab for portfolio-level accuracy percentages.
2. Open **Formula Audit** tab for per-line formula verification.
3. Export reports via the **Reports** toolbar.

[Screenshot: Benchmark Validation Center]

---

## 14. Export and Reports

### Export Excel (estimate)

**Who can export:** Estimator (own projects), QS, Admin — not Viewer.

**Prerequisites:** All **Validation** checks must pass (no critical errors).

1. Open project → **Estimate Summary** tab.
2. Resolve any validation errors shown in the **Validation** panel.
3. Click **Export to Excel**.
4. Save the downloaded file: `{ProjectCode}_Estimate_{YYYYMMDD}.xlsx`.

[Screenshot: Export to Excel Button]

**Workbook sheets typically include:**

1. Project Information  
2. Estimate Summary  
3. WBS  
4. Bill of Quantities  

> **Warning:** If Export is disabled, hover the button or read the validation panel for the blocking reason.

### Print (estimate)

1. On **Estimate Summary**, click **Print** or **Print preview**.
2. A new tab opens: `/projects/[id]/summary/print`.
3. Review the layout with company header/footer.

[Screenshot: Estimate Print View]

### Save as PDF

Quantix V1 does **not** generate PDF files directly. Use your browser:

1. Open the **Print** view (estimate or dashboard).
2. Press **Ctrl+P** (Windows) or **Cmd+P** (Mac).
3. Choose **Save as PDF** or **Microsoft Print to PDF** as the printer.
4. Click **Save**.

> **Tip:** Add `?autoprint=1` to the print URL to open the print dialog automatically.

### Bid summary report

The **Bid Summary** panel on Estimate Summary serves as your bid document source. It appears on:

- Estimate Summary screen  
- Print view  
- Excel export (Summary sheet)  

Configure header, footer, and signature in **Company Settings**.

### Executive export

From `/dashboard`:

1. Use **Export to Excel** in the executive reports toolbar.
2. Or open **Print** for portfolio PDF via browser.

---

## 15. Audit History

**Route:** `/projects/[projectId]/audit`  
**Tab:** **Audit History**

Every significant project change is logged for accountability.

[Screenshot: Audit History Table]

### View changes

1. Open **Audit History** tab.
2. Browse the chronological list — newest first.
3. Each entry shows **date/time**, **user**, **module**, **action**, and **change details**.

**Typical events:**

- Project created / details updated  
- Status changed (Draft → In Progress, etc.)  
- WBS node added / edited / deleted  
- BOQ item changed  
- Estimate exported  

### Filter by user / module / date

1. **User** — filter by team member.
2. **Module** — filter by area (Project, WBS, BOQ, etc.).
3. **Date from / Date to** — narrow the time range.
4. Filters reload the list automatically.

> **Note:** Audit log is **read-only** — entries cannot be edited or deleted.

---

## 16. Common Issues

### Cannot login

| Symptom | What to try |
|---------|-------------|
| "Invalid email or password" | Check caps lock; verify email with admin |
| Redirect loop | Clear cookies; try incognito window |
| Account inactive | Contact admin to activate your user row in `public.users` |
| Forgot password | Contact admin — self-reset not available in V1 |

### Missing data

| Symptom | What to try |
|---------|-------------|
| Project not in list | Check status filter; confirm you have access (Estimator sees own projects) |
| BOQ rows empty | Refresh page; confirm WBS exists and items are linked |
| Summary shows zero | Add BOQ items; click **Refresh** on summary |
| Library resource missing | Confirm **Active** flag; check admin imported it |

### Supabase error

| Symptom | What to try |
|---------|-------------|
| "Failed to fetch" / network error | Check internet; verify Supabase project is running |
| Permission denied | Your role may not allow the action — see Section 2 |
| Session expired | Log out and log in again |

### Export not working

| Symptom | What to try |
|---------|-------------|
| Button disabled | Fix validation errors on Validation tab |
| Button hidden | Your role may not have export permission (Viewer) |
| Download fails | Try smaller project first; check browser pop-up blocker |
| Wrong totals in Excel | Refresh summary first; compare Sheet 2 to on-screen totals |

### Slow loading

| Symptom | What to try |
|---------|-------------|
| Large BOQ (1000+ lines) | Use search/filter; wait for pagination |
| Dashboard slow | Apply filters to reduce portfolio size |
| WBS tree slow | Collapse unused branches; use search |

For more limits, see [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md).

---

## 17. Best Practice Workflow

Recommended sequence for a new estimate from scratch:

```
1. Company Settings     → Admin sets branding and default percentages
2. Resource Library     → Admin loads standard material/labor/equipment rates
3. Create Project       → Estimator creates Draft project
4. WBS                  → Build structure top-down (root → children)
5. BOQ                  → Add items, quantities, and rates per WBS leaf
6. Rate Analysis        → Detail critical items from library (optional but recommended)
7. Estimate Summary     → Verify direct cost, markups, grand total
8. AI Review            → Use AI Estimator to cross-check scope gaps (optional)
9. Validation           → Fix all errors until score is clean
10. Export              → Excel for client + Print/PDF for records
11. Lifecycle           → Submit → Approve when ready
```

**Quality checks before export:**

- [ ] Every WBS leaf has at least one BOQ item  
- [ ] No zero quantities on priced lines  
- [ ] Direct cost matches manual BOQ sum  
- [ ] Percentages match your company's bidding policy  
- [ ] Validation panel shows all checks passed  

---

## 18. Quick Start Guide (10 minutes)

Use this walkthrough to learn Quantix with a small sample project.

### Minute 0–1: Login

1. Sign in at `/login`.
2. Confirm you reach the Dashboard.

### Minute 1–2: Create project

1. Click **+ Create Project**.
2. Name: `Pilot Test Office` · Client: `Test Client` · Location: `Manila`.
3. Click **Create Project**.

### Minute 2–4: WBS

1. Open **WBS** tab → **Add Root Level** → `Structural`.
2. Select `Structural` → add child → `Concrete Works`.
3. Add child → `Formworks`.

[Screenshot: Quick Start WBS]

### Minute 4–7: BOQ

1. Open **BOQ** tab → **Add Item**.
2. Link to WBS `Formworks`.
3. Description: `Formwork to slab soffit` · Unit: `m2` · Qty: `500`.
4. Material: `0` · Labor: `350` · other rates: `0` → Total Rate **350** → Amount **175,000**.
5. Add a second item for concrete (Qty `120 m3`, Total Rate `8,500`).

### Minute 7–8: Summary

1. Open **Estimate Summary**.
2. Confirm **Direct Cost** = sum of your BOQ amounts.
3. Note OCM, Contingency, Profit, VAT, and **Grand Total**.

### Minute 8–9: Validation

1. Open **Validation** tab.
2. Fix any red items (usually missing units or zero qty).

### Minute 9–10: Export

1. Return to **Estimate Summary**.
2. Click **Export to Excel** (if validation passes).
3. Open the file and confirm Sheet 2 totals match the screen.

**Congratulations — you completed a end-to-end estimate in Quantix.**

---

## 19. Glossary

| Term | Definition |
|------|------------|
| **WBS** | **Work Breakdown Structure** — a hierarchical tree that organizes the project into manageable work packages (e.g. Structural → Concrete). |
| **BOQ** | **Bill of Quantities** — a line-item schedule listing description, unit, quantity, unit rates, and total amount for each work item. |
| **OCM** | **Overhead & Construction Management** — indirect project costs (site management, preliminaries) applied as a percentage of direct cost. Shown as **Indirect Cost** in Quantix. |
| **Contingency** | A percentage allowance added to cover risk, unknowns, and scope gaps. |
| **VAT** | **Value Added Tax** — tax percentage applied to the estimate total per local regulations. |
| **Rate Analysis** | Detailed breakdown of a BOQ unit rate into resource lines (materials, labor, equipment, subcontract) with consumption, waste, and productivity. |
| **Direct Cost** | Sum of all BOQ line amounts before overhead, contingency, profit, and tax. |
| **Grand Total** | Final estimate value including direct cost, OCM, contingency, profit, and VAT. |
| **Markup** | Profit margin applied as a percentage — labeled **Markup** or **Profit** in reports. |
| **Unit Rate** | Cost per unit of measure for one BOQ line (sum of material, labor, equipment, subcontract, and other rates). |
| **Total Amount** | BOQ line cost = Quantity × Unit Rate. |
| **Validation** | Automated quality checks (12 checks) before export is allowed. |
| **Benchmark** | A completed historical project used to compare estimate accuracy vs actual outcomes. |
| **Resource Library** | Company-wide catalog of standard rates used in rate analysis. |
| **Lifecycle** | Project status flow: Draft → In Progress → For Review → Approved → Archived. |

---

## Need Help?

| Resource | Location |
|----------|----------|
| Pilot testing steps | [PILOT_TEST_GUIDE.md](./PILOT_TEST_GUIDE.md) |
| Report a bug | [ISSUE_REPORT_TEMPLATE.md](./ISSUE_REPORT_TEMPLATE.md) |
| Known limits | [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md) |
| Release overview | [RELEASE_NOTES_V1.md](./RELEASE_NOTES_V1.md) |

---

*End of User Guide — Quantix V1 Pilot*
