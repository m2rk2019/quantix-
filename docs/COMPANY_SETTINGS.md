# Company Settings (Sprint 13)

Configure company profile, estimating defaults, and report branding at `/admin/settings`.

## Fields

| Setting | Purpose |
|---------|---------|
| Company name | Sidebar, reports, exports |
| Logo URL | Sidebar, print/PDF headers |
| Address, phone, email, website | Report headers |
| Default currency | New project defaults |
| VAT / OCM / Contingency / Profit % | New project defaults |
| Project code format | Reference format (display) |
| Report header / footer | All printable reports |
| Signature block | Bid summary, print/PDF |
| Theme color | UI accent, Excel headers, charts |

## Permissions

- **View:** All authenticated users (read via RLS)
- **Edit:** Admin and Super Admin only

## Applied To

- Estimate Summary (Bid Summary panel)
- Excel export (`/api/projects/[id]/export`)
- PDF/print (`/projects/[id]/summary/print`, `/dashboard/print`)
- Executive Dashboard (sidebar branding, theme color)
- New projects inherit default currency and markup percentages

## API / Services

| Path | Role |
|------|------|
| `services/company-settings/get-company-settings.ts` | Cached read (60s) |
| `services/company-settings/company-settings-actions.ts` | Admin update + audit |
| `lib/company/branding.ts` | Theme + report branding helpers |

## Cache

Updates call `revalidateTag('company-settings')` and refresh dashboard routes.

## Audit

Settings changes log `company_settings.updated` to `audit_log` (admin module).
