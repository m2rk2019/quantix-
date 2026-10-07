# UI/UX Specification — Quantix Version 1

| Field | Value |
|-------|-------|
| **Document** | UI_SPEC_V1 |
| **Product** | Quantix |
| **Version** | 1.0 |
| **Status** | Draft |
| **Last Updated** | 2026-06-25 |
| **Related** | [SRS_QUANTIX_V1.md](./SRS_QUANTIX_V1.md) · [ARCHITECTURE_V1.md](./ARCHITECTURE_V1.md) · [DATABASE_DESIGN_V1.md](./DATABASE_DESIGN_V1.md) |

---

## 1. Design Theme

### 1.1 Product Identity

Quantix V1 is a **modern cloud-based estimating platform** for construction professionals. The interface should feel comparable to polished B2B SaaS products (Linear, Notion, Stripe Dashboard) while remaining purpose-built for quantity surveying and cost estimating workflows.

### 1.2 Style Principles

| Principle | Description |
|-----------|-------------|
| **Clean** | Generous whitespace, clear visual hierarchy, no decorative clutter |
| **Minimal** | Show only what the current task requires; progressive disclosure for detail |
| **Fast** | Optimistic UI where safe; skeleton loaders over spinners; sub-second perceived navigation |
| **Desktop-first** | Primary layout optimized for 1280px+ screens; estimating work happens on desktop |
| **Responsive** | Tablet and mobile layouts remain usable for review and light edits |
| **Dark mode ready** | All colors defined as semantic tokens with light and dark variants from day one |
| **Professional** | Restrained palette, precise typography, data-dense tables without feeling cramped |

### 1.3 Visual Tone

- **Industry:** Construction and quantity surveying — trustworthy, precise, numbers-forward
- **Mood:** Confident and efficient, not playful or consumer-oriented
- **Data density:** Tables and trees may display many rows; use compact but readable row heights
- **Accent usage:** Color highlights status, actions, and totals — not decoration

### 1.4 Design Tokens

All visual properties are defined as **semantic tokens** (e.g. `--color-surface-primary`, `--text-heading`) rather than hard-coded values. This enables dark mode and future theming without component rewrites.

---

## 2. Global Layout

Authenticated screens share a consistent **app shell**. The Login page uses a standalone layout without the shell.

### 2.1 Layout Anatomy

```
┌──────────────────────────────────────────────────────────────────┐
│  HEADER  (fixed)                                                 │
│  Logo · Breadcrumb · Search (future) · User menu                 │
├────────────┬─────────────────────────────────────────────────────┤
│            │  PAGE TITLE + ACTIONS                               │
│  SIDEBAR   ├─────────────────────────────────────────────────────┤
│  (fixed)   │                                                     │
│            │  CONTENT AREA                                       │
│  Nav links │  Cards · Tables · Forms · Trees                     │
│            │                                                     │
│            │                                                     │
└────────────┴─────────────────────────────────────────────────────┘
```

| Region | Behavior | Content |
|--------|----------|---------|
| **Sidebar** | Fixed left, 240px wide; collapsible to 64px icon-only on desktop | Primary navigation: Dashboard, Projects; active state indicator |
| **Header** | Fixed top, 56px height; spans content area (not sidebar) | Breadcrumb, page-level actions, user avatar/menu |
| **Breadcrumb** | Inside header, left-aligned | `Dashboard > Projects > QX-2026-001 > BOQ` |
| **Content area** | Scrollable; padding 24px (desktop), 16px (tablet/mobile) | Page title, toolbar, main content |
| **Page title row** | Below header, above content | H1 title + primary/secondary action buttons right-aligned |

### 2.2 Login Page Layout

Standalone centered card on a neutral background. No sidebar or header.

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│                    ┌─────────────────────┐                       │
│                    │  Quantix logo       │                       │
│                    │  Sign in to your    │                       │
│                    │  account            │                       │
│                    │                     │                       │
│                    │  [ Email        ]   │                       │
│                    │  [ Password     ]   │                       │
│                    │  Forgot password?   │                       │
│                    │  [ Sign In      ]   │                       │
│                    └─────────────────────┘                       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

- Card max-width: 400px
- Vertically and horizontally centered
- Subtle brand mark above card title

### 2.3 Sidebar

| Property | Value |
|----------|-------|
| Width (expanded) | 240px |
| Width (collapsed) | 64px |
| Background | `--color-surface-sidebar` |
| Border | 1px right border `--color-border-subtle` |

**Navigation items (V1):**

| Icon | Label | Route |
|------|-------|-------|
| LayoutDashboard | Dashboard | `/dashboard` |
| FolderKanban | Projects | `/projects` |

- Active item: left accent bar (3px, primary color) + bold label + subtle background fill
- Hover: background `--color-surface-hover`
- Bottom section: collapsed toggle button, version label (`v1.0`)
- Project-context screens (WBS, BOQ, etc.) use **tabs within Project Details**, not sidebar entries

### 2.4 Header

| Zone | Content |
|------|---------|
| Left | Breadcrumb trail |
| Right | User avatar (initials) + dropdown: full name, role badge, Sign out |

- Height: 56px
- Background: `--color-surface-primary`
- Bottom border: 1px `--color-border-subtle`
- No global search in V1 (deferred)

### 2.5 Breadcrumb

- Separator: `/` or chevron icon
- Each segment except the last is a clickable link
- Current (last) segment: non-link, `--text-primary`, font-weight 500
- Truncate middle segments with ellipsis on narrow viewports
- Max depth example: `Projects / QX-2026-001 / BOQ`

### 2.6 Content Area

- Max content width: 1440px (centered within available space for very wide monitors)
- Standard page structure:

```
Page title                           [ Primary Action ]
Subtitle or description (optional)

[ Toolbar: search · filters · tabs ]

┌─────────────────────────────────────────────────────┐
│  Main content (card, table, tree, or form)          │
└─────────────────────────────────────────────────────┘
```

### 2.7 Cards

Used for Dashboard metrics, Project Details summary, and grouped form sections.

| Property | Value |
|----------|-------|
| Background | `--color-surface-card` |
| Border | 1px `--color-border-subtle` |
| Border radius | 8px |
| Padding | 20px (desktop), 16px (mobile) |
| Shadow | `--shadow-sm` (light mode only; border-only in dark mode) |

**Card anatomy:** optional label (uppercase, small, muted) → metric or title → optional description → optional footer action.

### 2.8 Tables

Primary data display for Projects list and BOQ grid.

| Property | Value |
|----------|-------|
| Row height | 40px (compact), 48px (default) |
| Header height | 44px |
| Header background | `--color-surface-secondary` |
| Row hover | `--color-surface-hover` |
| Row border | 1px bottom `--color-border-subtle` |
| Font | `--font-table` (13px / 0.8125rem) |
| Sticky header | Required for BOQ table |
| Zebra striping | Off by default; optional for very wide tables |

### 2.9 Forms

- Labels above inputs (not inline floating labels)
- Required fields marked with red asterisk
- Helper text below input in `--text-muted`, 12px
- Validation errors below input in `--color-danger`, with icon
- Field groups separated by 16px vertical gap; sections by 32px
- Two-column layout on desktop (≥1024px) where fields are independent; single column on mobile

### 2.10 Dialogs

Used for confirmations (delete WBS, delete BOQ item) and focused sub-forms.

| Property | Value |
|----------|-------|
| Overlay | `--color-overlay` (black 50% light / 70% dark) |
| Width | 480px (default), 640px (wide) |
| Border radius | 12px |
| Padding | 24px |
| Structure | Title → body text → footer (Cancel left, Confirm right) |

- Destructive confirmations: danger button for confirm action
- Focus trap while open; Escape to close (non-destructive only)
- Enter key submits when safe

### 2.11 Notifications (Toast)

| Type | Color | Duration |
|------|-------|----------|
| Success | `--color-success` left border | 4s auto-dismiss |
| Error | `--color-danger` left border | 6s or manual dismiss |
| Warning | `--color-warning` left border | 5s |
| Info | `--color-primary` left border | 4s |

- Position: bottom-right (desktop), bottom-center (mobile)
- Stack up to 3 visible toasts
- Content: icon + message + optional action link + dismiss button

### 2.12 Loading Screens

| Pattern | When |
|---------|------|
| **Skeleton** | Page content loading (Dashboard cards, project list, BOQ table rows) |
| **Spinner** | Button inline loading (Save, Export), small areas |
| **Full-page loader** | Initial app bootstrap only |
| **Progress bar** | Excel export generation |

- Skeleton shapes match final layout (card rectangles, table row bars)
- Never block entire app for partial data refresh

### 2.13 Empty States

Centered within content area when no data exists.

| Context | Illustration | Message | Action |
|---------|-------------|---------|--------|
| No projects | Folder icon | "No projects yet" | Create Project button |
| No WBS nodes | Tree icon | "No work breakdown structure" | Add Level button |
| No BOQ items | Table icon | "No line items for this WBS node" | Add Item button |
| Search no results | Search icon | "No results for '{query}'" | Clear search link |
| Viewer role | Lock icon | "You have read-only access" | None |

- Icon size: 48px, `--text-muted`
- Message: `--text-secondary`, 16px
- Action button: primary variant

---

## 3. Screen Specifications

### 3.1 Login

**Route:** `/login`

**Purpose:** Authenticate users via email and password (Supabase Auth).

#### Fields

| Field | Type | Placeholder | Required |
|-------|------|-------------|----------|
| Email | `email` input | `you@company.com` | Yes |
| Password | `password` input | `••••••••` | Yes |

- Password field includes show/hide toggle (eye icon)
- Autocomplete: `email`, `current-password`

#### Buttons

| Button | Variant | Behavior |
|--------|---------|----------|
| Sign In | Primary, full width | Submit form; shows inline spinner while authenticating |
| (none secondary) | — | — |

#### Validation

| Rule | Error message |
|------|---------------|
| Email empty | "Email is required" |
| Email invalid format | "Enter a valid email address" |
| Password empty | "Password is required" |
| Invalid credentials | "Invalid email or password" (generic, no email enumeration) |
| Network error | "Unable to connect. Check your connection and try again." |

- Inline validation on blur and on submit
- Invalid fields: red border + error text below

#### Forgot Password

- Link below password field: "Forgot password?"
- **V1 behavior:** Link opens a modal or navigates to `/forgot-password` with email field and "Send reset link" button
- **Note:** Password reset is out of SRS V1 core scope; the link may display "Contact your administrator" if reset is not yet implemented
- Success state: "If an account exists, a reset link has been sent."

#### Post-Login

- Redirect to `/dashboard`
- Session persisted via Supabase Auth token

---

### 3.2 Dashboard

**Route:** `/dashboard`

**Purpose:** Landing page with project overview and quick navigation.

#### Layout

```
Welcome back, {full_name}

┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Total        │ │ Active       │ │ Draft        │ │ Total        │
│ Projects     │ │ Projects     │ │ Projects     │ │ Estimate     │
│     12       │ │      8       │ │      4       │ │  $2.4M       │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

Recent Projects                          [ View All Projects ]
┌─────────────────────────────────────────────────────────────┐
│ Code      │ Name           │ Client    │ Status │ Total    │
│ QX-001    │ Tower A        │ Acme Ltd  │ Active │ $450,000 │
│ ...       │                │           │        │          │
└─────────────────────────────────────────────────────────────┘

Quick Actions
[ + Create Project ]   [ View All Projects ]
```

#### Cards (Statistics)

| Card | Data source | Format |
|------|-------------|--------|
| Total Projects | Count of accessible projects | Integer |
| Active Projects | Count where status = active | Integer |
| Draft Projects | Count where status = draft | Integer |
| Total Estimate Value | Sum of `estimate_summary.grand_total` | Currency, 2 decimals |

- Cards use metric card component with label, large number, optional trend (no trend in V1)

#### Recent Projects

- Table showing up to 10 most recently updated projects
- Columns: Project Code, Project Name, Client, Status (badge), Grand Total, Last Updated
- Row click → Project Details
- "View All Projects" link → Projects list

#### Quick Actions

| Action | Visibility | Destination |
|--------|-----------|-------------|
| Create Project | Estimator, Administrator | `/projects/new` |
| View All Projects | All roles | `/projects` |

#### Empty State

If user has no projects: statistics show `0`; recent projects section shows empty state with Create Project CTA (if permitted).

---

### 3.3 Projects

**Route:** `/projects`

**Purpose:** Searchable, filterable directory of all accessible projects.

#### Project List

| Column | Sortable | Notes |
|--------|----------|-------|
| Project Code | Yes | Monospace or medium weight |
| Project Name | Yes | Primary link to Project Details |
| Client | Yes | |
| Location | No | Hidden on tablet/mobile |
| Status | Yes | Badge component |
| Grand Total | Yes | Right-aligned, currency |
| Last Updated | Yes | Relative date ("2 days ago") + absolute on hover |
| Actions | No | Row menu: View, Edit (if permitted) |

- Pagination: 25 rows per page (configurable: 10, 25, 50)
- Row click navigates to Project Details

#### Search

- Search input in toolbar, left-aligned
- Placeholder: "Search by name, code, or client…"
- Debounced 300ms
- Searches: `project_name`, `project_code`, `client_name`
- Clear button (×) when query is non-empty

#### Filter

| Filter | Type | Options |
|--------|------|---------|
| Status | Multi-select dropdown | Draft, Active, Closed |
| (future) Client | Dropdown | Deferred |

- Active filters shown as removable chips below toolbar
- "Clear all filters" link when any filter active

#### Sort

- Click column header to toggle asc/desc
- Default sort: `updated_at` descending
- Sort indicator: chevron up/down in header

#### Create Project Button

- Primary button in page title row: `+ Create Project`
- Visible to Estimator and Administrator only
- Navigates to `/projects/new`

---

### 3.4 Create Project

**Route:** `/projects/new`

**Purpose:** Initialize a new project with header and detail fields.

#### Project Information Form

Two sections in a single card (or two stacked cards):

**Section 1 — Project Header**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Project Name | Text | Yes | Max 255 chars |
| Project Code | Text | Yes | Max 50 chars, unique, alphanumeric + hyphens |
| Client Name | Text | Yes | Max 255 chars |
| Location | Text | No | Max 255 chars |
| Status | Select | Yes | Default: Draft |

**Section 2 — Project Details**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Description | Textarea | No | Max 2000 chars |
| Owner | Text | No | Max 255 chars |
| Consultant | Text | No | Max 255 chars |
| Start Date | Date picker | No | |
| Target Finish | Date picker | No | Must be ≥ start date |
| Remarks | Textarea | No | Max 2000 chars |

#### Validation

- Inline on blur for individual fields
- Full validation on submit
- Project code uniqueness: async check with inline "Code already in use" error
- Date validation: "Target finish must be on or after start date"

#### Buttons

| Button | Variant | Position | Behavior |
|--------|---------|----------|----------|
| Cancel | Secondary/Ghost | Footer left | Navigate to `/projects`; confirm if dirty |
| Create Project | Primary | Footer right | Submit; spinner while saving |

#### Success

- Toast: "Project created successfully"
- Redirect to `/projects/{id}` (Project Details)

---

### 3.5 Project Details

**Route:** `/projects/{id}`

**Purpose:** Project hub with metadata, summary metrics, and tab navigation to WBS, BOQ, and Estimate Summary.

#### Project Information

Displayed in a card at top (view mode) or inline edit form (edit mode).

| Field | Source |
|-------|--------|
| Project Code | `projects.project_code` |
| Project Name | `projects.project_name` |
| Client | `projects.client_name` |
| Location | `projects.location` |
| Status | Badge |
| Description | `project_details.description` |
| Owner | `project_details.owner` |
| Consultant | `project_details.consultant` |
| Start Date | `project_details.start_date` |
| Target Finish | `project_details.target_finish` |
| Remarks | `project_details.remarks` |
| Created By | `users.full_name` |
| Last Updated | `projects.updated_at` |

- **Edit** button (Estimator, Administrator): toggles inline edit mode
- **Save / Cancel** in edit mode
- Viewers see read-only display with no Edit button

#### Summary Cards

Three metric cards below project information:

| Card | Value |
|------|-------|
| WBS Nodes | Count of WBS nodes |
| BOQ Items | Count of BOQ line items |
| Grand Total | `estimate_summary.grand_total` formatted as currency |

#### Tabs

Horizontal tab bar below summary cards:

| Tab | Route suffix | Content |
|-----|-------------|---------|
| Overview | (default, no suffix) | Project information + summary cards |
| WBS | `/wbs` | WBS tree editor |
| BOQ | `/boq` | BOQ editable table |
| Estimate Summary | `/estimate` | Cost summary + export |

- Active tab: primary color underline (2px)
- Tab state preserved in URL for deep linking and browser back/forward
- Breadcrumb updates per tab: `Projects / QX-001 / WBS`

---

### 3.6 WBS

**Route:** `/projects/{id}/wbs`

**Purpose:** Hierarchical work breakdown structure editor.

#### Tree View

```
▼ 1    Preliminaries                          $12,500
  ▼ 1.1  Site Setup                            $8,000
      1.1.1  Fencing                           $3,000
      1.1.2  Site Office                       $5,000
  ▶ 1.2  Temporary Works                        $4,500
▼ 2    Structure                               $85,000
  ▶ 2.1  Foundations                           ...
```

| Column | Width | Content |
|--------|-------|---------|
| Expand/Collapse | 32px | Chevron icon; click toggles children |
| WBS Code | 100px | Monospace, e.g. `1.2.3` |
| Description | flex | Node name |
| Subtotal | 120px | Right-aligned currency (rollup of BOQ items under node) |
| Actions | 80px | Edit, Delete, Add Child icons |

- Tree lines (indent guides) at 24px per level
- Maximum practical indent: 10 levels before horizontal scroll

#### Expand/Collapse

- Click chevron or double-click row to toggle
- Toolbar buttons: **Expand All** / **Collapse All**
- Remember expansion state in session (not persisted V1)

#### Add Level

| Action | Trigger | Behavior |
|--------|---------|----------|
| Add Root Level | Toolbar button | Opens inline row or modal at tree root |
| Add Child | Row action icon | Adds child under selected node |
| Add Sibling | Row action icon (optional) | Adds node at same level |

**Add/Edit form fields:**

| Field | Required |
|-------|----------|
| WBS Code | Yes, unique within project |
| Description | Yes |
| Parent | Auto-set based on context |

#### Edit

- Inline edit (double-click row) or Edit icon → inline fields or side panel
- Save on Enter or explicit Save; Cancel on Escape

#### Delete

- Delete icon → confirmation dialog
- Dialog text: "Delete '{wbs_code} — {description}' and all child nodes and BOQ items? This cannot be undone."
- Confirm: danger button "Delete"
- Soft delete per database design

#### Copy/Paste

| Action | Shortcut | Behavior |
|--------|----------|----------|
| Copy node | `Ctrl+C` | Copies node + all descendants to clipboard (internal) |
| Paste | `Ctrl+V` | Pastes as children of selected node (new codes generated or prompted) |
| Cut | `Ctrl+X` | Copy + mark for move on paste |

- Visual feedback: toast "Copied" / "Pasted"
- Copy/paste operates within the same project in V1

#### Drag Ordering (Future)

- **V1:** Not implemented; use sort order via Edit or move up/down buttons in row menu
- **Future:** Drag handle on row to reorder siblings; drag to reparent across levels
- UI reserves 24px drag handle column (hidden in V1) to avoid layout shift later

#### Toolbar

```
[ + Add Root Level ]  [ Expand All ]  [ Collapse All ]     Search WBS…
```

#### Empty State

"No work breakdown structure. Add a root level to get started." + Add Root Level button.

#### Viewer Mode

All edit actions hidden; tree is read-only.

---

### 3.7 BOQ

**Route:** `/projects/{id}/boq`

**Purpose:** Editable bill of quantities grid with inline editing and automatic totals.

#### Layout

```
WBS filter: [ All ▼ ]  or  [ 1.1 Site Setup ▼ ]        Search items…

┌────────────────────────────────────────────────────────────────────────────┐
│ Code │ Description │ Unit │ Qty │ Mat. │ Labor │ Equip. │ Subcon. │ Total │ Amount │ ▾ │
├────────────────────────────────────────────────────────────────────────────┤
│ 001  │ Excavation  │  m³  │ 150 │ 12.00│  8.00 │   5.00 │    0.00 │ 25.00 │3,750.00│   │
│ 002  │ Concrete    │  m³  │  80 │ 85.00│ 25.00 │  10.00 │    0.00 │120.00 │9,600.00│   │
│ ...  │             │      │     │      │       │        │         │       │        │   │
├────────────────────────────────────────────────────────────────────────────┤
│                                          WBS Subtotal:        $13,350.00 │
│                                          Project Total:      $125,000.00 │
└────────────────────────────────────────────────────────────────────────────┘

[ + Add Item ]
```

#### Columns

| Column | Width | Editable | Format |
|--------|-------|----------|--------|
| Item Code | 80px | Yes | Text |
| Description | flex (min 200px) | Yes | Text |
| Unit | 60px | Yes | Text or select (m, m², m³, nr, kg, item) |
| Quantity | 80px | Yes | Number, 2 decimals, right-aligned |
| Material Rate | 90px | Yes | Currency, 2 decimals |
| Labor Rate | 90px | Yes | Currency, 2 decimals |
| Equipment Rate | 90px | Yes | Currency, 2 decimals |
| Subcontract Rate | 90px | Yes | Currency, 2 decimals |
| Total Rate | 90px | No (computed) | Currency, muted text |
| Total Amount | 110px | No (computed) | Currency, bold |
| Actions | 48px | — | Delete icon |

#### Inline Editing

- Click cell to enter edit mode (input appears in cell)
- Tab moves to next editable cell in row
- Enter saves row and moves to next row same column
- Escape cancels edit
- Unsaved row highlighted with subtle left border (primary color)
- Auto-save on row blur (debounced 500ms) or explicit Save per row

#### Automatic Totals

| Calculation | Display |
|-------------|---------|
| `total_rate = material + labor + equipment + subcontract` | Total Rate column, updates live |
| `total_amount = quantity × total_rate` | Total Amount column, updates live |
| WBS subtotal | Footer row when WBS filter active |
| Project total | Footer row always visible |

- Totals recalculate on every keystroke (debounced 150ms for performance)
- Footer row sticky at bottom of table

#### Search

- Filters visible rows by item code or description
- Works in combination with WBS filter

#### Sorting

- Click column header to sort (Item Code, Description, Total Amount)
- Only one sort column active at a time
- Default: item code ascending

#### Sticky Header

- Table header row sticks to top of scroll container when scrolling vertically
- Footer totals stick to bottom of scroll container

#### WBS Filter

- Dropdown above table: "All WBS nodes" or select a specific node (shows items for that node only)
- Hierarchical dropdown with indentation matching WBS tree

#### Add Item

- `+ Add Item` button below table (or toolbar)
- Inserts new empty row at bottom of current filter scope
- Focus moves to Item Code cell
- WBS assignment: uses current WBS filter selection, or prompts if "All" selected

#### Delete

- Row delete icon → confirmation dialog → soft delete
- Keyboard: select row + Delete key (with confirmation)

#### Empty State

"No line items. Add an item or select a different WBS node."

#### Viewer Mode

Table is read-only; no inline editing, no Add/Delete.

---

### 3.8 Estimate Summary

**Route:** `/projects/{id}/estimate`

**Purpose:** Project-level cost rollup with overhead components and Excel export.

#### Layout

```
┌─────────────────────────────────────┐  ┌──────────────────────────────────┐
│  COST SUMMARY                       │  │  WBS ROLLUP                      │
│                                     │  │                                  │
│  Direct Cost        $120,000.00     │  │  ▼ 1  Preliminaries   $12,500   │
│  Indirect Cost       $12,000.00  ✎  │  │    1.1 Site Setup      $8,000   │
│  Contingency          $6,000.00  ✎  │  │    1.2 Temp Works      $4,500   │
│  Markup                $9,600.00  ✎  │  │  ▼ 2  Structure       $85,000   │
│  VAT                  $14,760.00  ✎  │  │    2.1 Foundations    $40,000   │
│  ─────────────────────────────────  │  │    ...                           │
│  GRAND TOTAL        $162,360.00     │  │                                  │
│                                     │  │                                  │
│  [ Export to Excel ]                │  │                                  │
└─────────────────────────────────────┘  └──────────────────────────────────┘
```

#### Cost Summary Panel (Left)

| Line | Source | Editable |
|------|--------|----------|
| **Direct Cost** | Sum of all BOQ `total_amount` | No (read-only computed) |
| **Indirect Cost** | `estimate_summary.indirect_cost` | Yes (Estimator, Admin) |
| **Contingency** | `estimate_summary.contingency` | Yes |
| **Markup** | `estimate_summary.markup` | Yes |
| **VAT** | `estimate_summary.vat` | Yes |
| **Grand Total** | `direct + indirect + contingency + markup + vat` | No (computed) |

- Editable fields: click value to edit inline (currency input)
- Save on blur; toast on success
- Grand Total row: larger font (20px), bold, primary color accent
- Divider line above Grand Total

#### WBS Rollup Panel (Right)

- Read-only tree matching WBS hierarchy
- Columns: WBS Code, Description, Combined Total
- Expand/collapse per node
- Combined total = direct BOQ items under node + all descendant totals
- Mirrors SRS FR-EST-001 through FR-EST-003

#### Export to Excel

| Property | Value |
|----------|-------|
| Button | Secondary with download icon, label "Export to Excel" |
| Position | Below cost summary panel |
| Visibility | Estimator, Administrator only |
| Behavior | Click → spinner on button → file download |
| Filename | `{ProjectCode}_Estimate_{YYYYMMDD}.xlsx` |
| Sheets | Project Info, WBS Summary, BOQ Detail (per SRS) |
| Success | Toast: "Export downloaded" |
| Error | Toast: "Export failed. Try again." |

#### Viewer Mode

Cost summary and WBS rollup are read-only; Export button hidden.

---

## 4. Component Library

Reusable components form the building blocks of every screen. All components support light/dark mode via design tokens.

### 4.1 Button

| Variant | Usage | Visual |
|---------|-------|--------|
| **Primary** | Main action (Create, Save, Sign In) | Filled primary background, white text |
| **Secondary** | Secondary action (Cancel, Export) | Outlined border, primary text |
| **Ghost** | Tertiary action (toolbar icons) | No border, hover background |
| **Danger** | Destructive confirm (Delete) | Filled danger background |
| **Link** | Inline navigation | Text only, underline on hover |

| Size | Height | Padding | Font |
|------|--------|---------|------|
| `sm` | 32px | 12px horizontal | 13px |
| `md` | 36px | 16px horizontal | 14px |
| `lg` | 40px | 20px horizontal | 14px |

- Disabled: 50% opacity, no pointer events
- Loading: spinner replaces label, button disabled
- Icon support: leading or trailing icon, 16px

### 4.2 Input

| Type | Usage |
|------|-------|
| Text | Single-line text fields |
| Email | Login email |
| Password | Login password (with toggle) |
| Number | Quantities, rates |
| Date | Start date, target finish |
| Textarea | Description, remarks |

| State | Visual |
|-------|--------|
| Default | 1px border `--color-border` |
| Focus | 2px ring `--color-primary` |
| Error | 1px border `--color-danger` + error text |
| Disabled | Muted background, no pointer |

- Height: 36px (single line)
- Border radius: 6px
- Font: 14px

### 4.3 Select

- Dropdown with chevron indicator
- Single select (V1); multi-select for status filter
- Options list max-height 240px with scroll
- Selected value displayed in trigger

### 4.4 Table

| Feature | Support |
|---------|---------|
| Sortable columns | Click header |
| Sticky header | Optional prop |
| Sticky footer | Optional prop (BOQ totals) |
| Row selection | Single row (BOQ, future) |
| Inline edit cells | BOQ module |
| Compact mode | 40px rows |
| Empty state slot | Centered message |
| Loading state | Skeleton rows |

### 4.5 Tree

| Feature | Support |
|---------|---------|
| Expand/collapse | Per node |
| Indent levels | 24px per level |
| Inline edit | WBS module |
| Row actions | Icon buttons |
| Subtotal column | Currency, right-aligned |
| Expand all / collapse all | Toolbar |
| Keyboard navigation | Arrow keys (future) |

### 4.6 Modal

- Same as Dialog (Section 2.10)
- Used for: delete confirmations, forgot password, add WBS node (alternative to inline)

### 4.7 Dialog

Alias of Modal. Confirmation dialogs use danger styling for destructive actions.

### 4.8 Card

| Variant | Usage |
|---------|-------|
| **Metric** | Dashboard statistics (label + large value) |
| **Content** | Grouped form sections, project info |
| **Interactive** | Clickable project cards (future) |

### 4.9 Badge

| Variant | Color | Usage |
|---------|-------|-------|
| `draft` | Neutral gray | Project status: Draft |
| `active` | Success green | Project status: Active |
| `closed` | Muted gray | Project status: Closed |
| `administrator` | Primary blue | User role |
| `estimator` | Info blue | User role |
| `viewer` | Neutral | User role |

- Size: 22px height, 8px horizontal padding, 12px font, pill radius

### 4.10 Toast

See Section 2.11. Component with icon, message, optional action, dismiss, and auto-dismiss timer.

### 4.11 Loading Spinner

| Size | Usage |
|------|-------|
| `sm` (16px) | Inline button loading |
| `md` (24px) | Card/section loading |
| `lg` (40px) | Full-page bootstrap |

- Color: `--color-primary`
- Animation: rotate 360° / 800ms linear infinite

### 4.12 Empty State

See Section 2.13. Composed of icon, title, description, and optional action button.

### 4.13 Additional Components (V1)

| Component | Usage |
|-----------|-------|
| **Breadcrumb** | Header navigation |
| **Avatar** | User menu (initials circle, 32px) |
| **Dropdown Menu** | User menu, row actions, column sort |
| **Tabs** | Project Details module navigation |
| **Tooltip** | Icon button labels, truncated text |
| **Pagination** | Projects list |
| **Filter Chips** | Active filter display |
| **Currency Input** | BOQ rates, estimate summary overhead fields |
| **Date Picker** | Project dates |
| **Skeleton** | Loading placeholders |

---

## 5. Responsive Behavior

### 5.1 Breakpoints

| Name | Range | Primary use |
|------|-------|-------------|
| **Desktop** | ≥ 1280px | Full layout, all columns, sidebar expanded |
| **Tablet** | 768px – 1279px | Sidebar collapsed to icons; some table columns hidden |
| **Mobile** | < 768px | Sidebar hidden (hamburger drawer); stacked layouts |

### 5.2 Desktop (≥ 1280px)

- Sidebar expanded (240px)
- Full table columns visible
- Two-column form layouts
- Estimate Summary: side-by-side panels (40/60 split)
- BOQ table: horizontal scroll only if viewport < 1280px with all rate columns

### 5.3 Tablet (768px – 1279px)

- Sidebar collapsed to 64px icon-only; expand on hover or toggle
- Projects table: hide Location column
- BOQ table: horizontal scroll enabled; sticky first column (Item Code + Description)
- Estimate Summary: stacked panels (cost summary above WBS rollup)
- Page padding reduced to 16px

### 5.4 Mobile (< 768px)

- Sidebar hidden; hamburger menu in header opens drawer overlay
- Projects list: card layout instead of table (code, name, status, total per card)
- BOQ: not recommended for extended editing; read-only card list per item with key fields
- WBS: simplified indented list (no subtotal column)
- Forms: single column
- Dashboard cards: 2-column grid
- Toast: bottom-center
- Dialogs: full-width with 16px margin

### 5.5 Responsive Priority

Desktop is the **primary design target**. Mobile layouts prioritize **read access** over full editing capability. Show a banner on mobile BOQ edit attempts: "For best experience, use a desktop browser to edit BOQ items."

---

## 6. Color Palette

All colors defined as CSS custom properties with light and dark variants.

### 6.1 Primary

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--color-primary` | `#2563EB` | `#3B82F6` | Buttons, links, active tab, focus ring |
| `--color-primary-hover` | `#1D4ED8` | `#60A5FA` | Button hover |
| `--color-primary-subtle` | `#EFF6FF` | `#1E3A5F` | Active nav background, selected row |

### 6.2 Success

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--color-success` | `#16A34A` | `#22C55E` | Success toast, Active status badge |
| `--color-success-subtle` | `#F0FDF4` | `#14532D` | Success background |

### 6.3 Warning

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--color-warning` | `#D97706` | `#F59E0B` | Warning toast, unsaved changes indicator |
| `--color-warning-subtle` | `#FFFBEB` | `#451A03` | Warning background |

### 6.4 Danger

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--color-danger` | `#DC2626` | `#EF4444` | Delete buttons, validation errors, danger toast |
| `--color-danger-subtle` | `#FEF2F2` | `#450A0A` | Error background |

### 6.5 Neutral

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--color-surface-primary` | `#FFFFFF` | `#0F172A` | Page background |
| `--color-surface-secondary` | `#F8FAFC` | `#1E293B` | Table header, sidebar |
| `--color-surface-card` | `#FFFFFF` | `#1E293B` | Card background |
| `--color-surface-sidebar` | `#F8FAFC` | `#0F172A` | Sidebar background |
| `--color-surface-hover` | `#F1F5F9` | `#334155` | Row hover, nav hover |
| `--color-border` | `#E2E8F0` | `#334155` | Input borders, card borders |
| `--color-border-subtle` | `#F1F5F9` | `#1E293B` | Table row dividers |
| `--text-primary` | `#0F172A` | `#F8FAFC` | Headings, body text |
| `--text-secondary` | `#475569` | `#94A3B8` | Descriptions, labels |
| `--text-muted` | `#94A3B8` | `#64748B` | Placeholders, disabled |
| `--color-overlay` | `rgba(0,0,0,0.5)` | `rgba(0,0,0,0.7)` | Modal overlay |

### 6.6 Dark Mode

- Toggle in user menu (V1) or follow system preference (`prefers-color-scheme`)
- All components use semantic tokens — no hard-coded hex in components
- Shadows reduced in dark mode; rely on border contrast instead
- Chart and table zebra colors adjusted for dark backgrounds

---

## 7. Typography

### 7.1 Font Family

| Token | Value | Usage |
|-------|-------|-------|
| `--font-sans` | `Inter, system-ui, -apple-system, sans-serif` | All UI text |
| `--font-mono` | `JetBrains Mono, ui-monospace, monospace` | Project codes, WBS codes, item codes |

**Recommendation:** Load Inter from Google Fonts (weights 400, 500, 600, 700). JetBrains Mono for codes (weight 400, 500).

### 7.2 Headings

| Level | Size | Weight | Line height | Usage |
|-------|------|--------|-------------|-------|
| H1 | 24px / 1.5rem | 600 | 32px | Page titles |
| H2 | 20px / 1.25rem | 600 | 28px | Section titles, card headers |
| H3 | 16px / 1rem | 600 | 24px | Subsection titles |
| H4 | 14px / 0.875rem | 600 | 20px | Table group headers, metric labels |

### 7.3 Body

| Variant | Size | Weight | Line height | Usage |
|---------|------|--------|-------------|-------|
| Body | 14px | 400 | 20px | Default text, descriptions |
| Body small | 13px | 400 | 18px | Helper text, timestamps |
| Label | 13px | 500 | 18px | Form labels |
| Caption | 12px | 400 | 16px | Badges, footnotes |

### 7.4 Table

| Element | Size | Weight | Usage |
|---------|------|--------|-------|
| Header | 13px | 500 | Column headers, uppercase optional |
| Cell | 13px | 400 | Default cell text |
| Cell (numeric) | 13px | 400 | Right-aligned, tabular nums (`font-variant-numeric: tabular-nums`) |
| Footer | 13px | 600 | BOQ totals row |

### 7.5 Buttons

| Size | Font size | Weight |
|------|-----------|--------|
| sm | 13px | 500 |
| md | 14px | 500 |
| lg | 14px | 600 |

---

## 8. Icons

### 8.1 Recommended Library

**[Lucide Icons](https://lucide.dev/)** — open source, consistent 24px grid, 1.5px stroke, tree-shakeable.

**Why Lucide:**
- Modern, clean stroke style matching Quantix minimal aesthetic
- Extensive icon set covering construction, navigation, and data actions
- React-compatible (implementation phase) with SVG exports
- Active maintenance and community adoption in SaaS products

### 8.2 Icon Sizes

| Context | Size |
|---------|------|
| Inline with text | 16px |
| Button leading icon | 16px |
| Toolbar / row action | 18px |
| Empty state | 48px |
| Sidebar navigation | 20px |

### 8.3 Key Icons (V1)

| Icon name | Usage |
|-----------|-------|
| `LayoutDashboard` | Dashboard nav |
| `FolderKanban` | Projects nav |
| `Plus` | Create, Add actions |
| `Pencil` | Edit |
| `Trash2` | Delete |
| `ChevronRight` / `ChevronDown` | Tree expand/collapse, breadcrumb |
| `Search` | Search inputs |
| `Download` | Export to Excel |
| `LogOut` | Sign out |
| `Eye` / `EyeOff` | Password toggle |
| `Check` | Success, save confirmation |
| `X` | Close, dismiss, clear |
| `AlertTriangle` | Warning |
| `AlertCircle` | Error |
| `Loader2` | Spinner (animated rotate) |
| `GripVertical` | Drag handle (future) |
| `Copy` / `Clipboard` | Copy/paste WBS |
| `ArrowUpDown` | Sort indicator |

- Icon color inherits text color by default
- Action icons: `--text-muted` default, `--text-primary` on hover
- Destructive: `--color-danger` on hover only

---

## 9. UX Principles

### 9.1 Fast Navigation

- Every project module reachable within **2 clicks** from Dashboard (Dashboard → Project → Tab)
- Sidebar links for top-level modules; tabs for project-context modules
- URL-based routing enables bookmarking and browser back/forward
- Prefetch project data on Projects list hover (implementation optimization)
- Page transitions: no full reload; client-side routing with skeleton loading

### 9.2 Minimal Clicks

| Task | Target clicks |
|------|---------------|
| Create project | 2 (Create button → Submit) |
| Add BOQ item | 1 (+ Add Item, inline edit) |
| Add WBS child | 2 (Select parent → Add Child) |
| Export estimate | 1 (Export button) |
| Switch project module | 1 (Tab click) |

- Inline editing eliminates modal overhead for BOQ and WBS
- Auto-save on BOQ row blur reduces explicit Save clicks
- Batch actions deferred to V2

### 9.3 Keyboard-Friendly

| Shortcut | Action | Context |
|----------|--------|---------|
| `Tab` / `Shift+Tab` | Move between fields/cells | Forms, BOQ table |
| `Enter` | Submit form / save row | Forms, BOQ |
| `Escape` | Cancel edit / close dialog | Global |
| `Ctrl+C` / `Ctrl+V` / `Ctrl+X` | Copy / paste / cut | WBS tree |
| `Delete` | Delete selected row (with confirm) | BOQ, WBS |
| `Ctrl+S` | Save current form | Project edit mode |

- Visible focus rings on all interactive elements (`:focus-visible`)
- Skip-to-content link for accessibility (hidden until focused)

### 9.4 Professional Estimating Workflow

The UI follows the natural estimating sequence:

```
Create Project → Build WBS → Enter BOQ → Review Summary → Export
```

- Project Details tabs ordered left-to-right matching workflow: Overview → WBS → BOQ → Estimate Summary
- WBS subtotals visible while building structure (immediate feedback)
- BOQ totals update live as rates are entered (spreadsheet-like familiarity)
- Estimate Summary is the final review gate before export
- Currency values always display 2 decimal places with thousands separators

### 9.5 Consistent Layout

- Every authenticated page uses the same app shell (sidebar + header + content)
- Page title always in the same position (top of content area)
- Primary action always top-right of page title row
- Tables, forms, and cards use the same spacing, border, and radius tokens
- Status badges, currency formats, and date formats are identical across all screens
- Role-based UI changes are consistent: Viewers never see edit/delete/create buttons on any screen

---

## 10. Accessibility (V1 Baseline)

| Requirement | Approach |
|-------------|----------|
| Color contrast | WCAG AA minimum (4.5:1 body text, 3:1 large text) |
| Focus management | Focus trap in modals; return focus on close |
| Screen readers | Semantic HTML landmarks; `aria-label` on icon-only buttons |
| Form labels | All inputs have associated `<label>` elements |
| Error identification | Errors linked via `aria-describedby` |
| Motion | Respect `prefers-reduced-motion`; no essential info in animation |

---

## 11. Out of Scope (UI)

The following UI capabilities are **not** part of V1:

- AI chat panel or suggestion overlays
- Procurement, contracts, and cash flow screens
- PlanSwift import wizard
- Advanced report builder or chart dashboards
- Real-time collaborative cursors or presence indicators
- User management admin panel (Administrator provisions users out of band in V1)
- Drag-and-drop WBS reordering (reserved in layout, not functional)
- Custom themes beyond light/dark
- Mobile-native app or PWA install prompt
- Onboarding tour or walkthrough
- Application code, React components, or Storybook

---

## 12. Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Design Lead | | | |
| Technical Lead | | | |

---

*End of Document*
