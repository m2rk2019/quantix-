'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateCompanySettingsAction } from '@/services/company-settings/company-settings-actions';
import type { CompanySettings } from '@/types/company-settings';
import { CURRENCY_OPTIONS } from '@/lib/constants/project-options';
import type { CurrencyCode } from '@/types/project';

const CURRENCIES: CurrencyCode[] = CURRENCY_OPTIONS.map((option) => option.value);

interface CompanySettingsFormProps {
  initial: CompanySettings;
  canEdit: boolean;
}

export function CompanySettingsForm({
  initial,
  canEdit,
}: CompanySettingsFormProps): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    company_name: initial.company_name,
    logo_url: initial.logo_url ?? '',
    address: initial.address ?? '',
    phone: initial.phone ?? '',
    email: initial.email ?? '',
    website: initial.website ?? '',
    default_currency: initial.default_currency,
    default_vat_percent: String(initial.default_vat_percent),
    default_ocm_percent: String(initial.default_ocm_percent),
    default_contingency_percent: String(initial.default_contingency_percent),
    default_profit_percent: String(initial.default_profit_percent),
    project_code_format: initial.project_code_format,
    report_header: initial.report_header ?? '',
    report_footer: initial.report_footer ?? '',
    signature_block: initial.signature_block ?? '',
    theme_color: initial.theme_color,
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canEdit) {
      return;
    }

    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateCompanySettingsAction({
        company_name: form.company_name,
        logo_url: form.logo_url || null,
        address: form.address || null,
        phone: form.phone || null,
        email: form.email || null,
        website: form.website || null,
        default_currency: form.default_currency,
        default_vat_percent: Number(form.default_vat_percent) || 0,
        default_ocm_percent: Number(form.default_ocm_percent) || 0,
        default_contingency_percent: Number(form.default_contingency_percent) || 0,
        default_profit_percent: Number(form.default_profit_percent) || 0,
        project_code_format: form.project_code_format,
        report_header: form.report_header || null,
        report_footer: form.report_footer || null,
        signature_block: form.signature_block || null,
        theme_color: form.theme_color,
      });

      if (!result.ok) {
        setError(result.error ?? 'Failed to save settings.');
        return;
      }

      setSuccess(true);
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {!canEdit && (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800">
          Read-only access. Contact an administrator to edit company settings.
        </p>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <h2 className="md:col-span-2 text-lg font-semibold">Company Profile</h2>
        <div className="space-y-1.5">
          <Label htmlFor="company_name">Company Name</Label>
          <Input
            id="company_name"
            value={form.company_name}
            disabled={!canEdit}
            onChange={(e) => setForm({ ...form, company_name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="logo_url">Logo URL</Label>
          <Input
            id="logo_url"
            value={form.logo_url}
            disabled={!canEdit}
            placeholder="https://…"
            onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={form.address}
            disabled={!canEdit}
            rows={2}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={form.phone}
            disabled={!canEdit}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            disabled={!canEdit}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            value={form.website}
            disabled={!canEdit}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <h2 className="md:col-span-2 text-lg font-semibold">Estimating Defaults</h2>
        <div className="space-y-1.5">
          <Label>Default Currency</Label>
          <Select
            value={form.default_currency}
            disabled={!canEdit}
            onValueChange={(value) =>
              setForm({ ...form, default_currency: value as CurrencyCode })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="project_code_format">Project Code Format</Label>
          <Input
            id="project_code_format"
            value={form.project_code_format}
            disabled={!canEdit}
            onChange={(e) =>
              setForm({ ...form, project_code_format: e.target.value })
            }
          />
          <p className="text-xs text-muted-foreground">
            Reference format for new projects (e.g. QTX-{'{YYYY}'}-{'{SEQ:6}'}).
          </p>
        </div>
        {(
          [
            ['default_vat_percent', 'VAT %'],
            ['default_ocm_percent', 'OCM %'],
            ['default_contingency_percent', 'Contingency %'],
            ['default_profit_percent', 'Profit %'],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="space-y-1.5">
            <Label htmlFor={key}>{label}</Label>
            <Input
              id={key}
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={form[key]}
              disabled={!canEdit}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </div>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <h2 className="md:col-span-2 text-lg font-semibold">Reports & Branding</h2>
        <div className="space-y-1.5">
          <Label htmlFor="theme_color">Theme Color</Label>
          <div className="flex gap-2">
            <Input
              id="theme_color"
              value={form.theme_color}
              disabled={!canEdit}
              onChange={(e) => setForm({ ...form, theme_color: e.target.value })}
            />
            <input
              type="color"
              value={form.theme_color.startsWith('#') ? form.theme_color : '#1f4e79'}
              disabled={!canEdit}
              onChange={(e) => setForm({ ...form, theme_color: e.target.value })}
              className="h-10 w-12 cursor-pointer rounded border"
              aria-label="Pick theme color"
            />
          </div>
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="report_header">Report Header</Label>
          <Textarea
            id="report_header"
            value={form.report_header}
            disabled={!canEdit}
            rows={2}
            onChange={(e) => setForm({ ...form, report_header: e.target.value })}
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="report_footer">Report Footer</Label>
          <Textarea
            id="report_footer"
            value={form.report_footer}
            disabled={!canEdit}
            rows={2}
            onChange={(e) => setForm({ ...form, report_footer: e.target.value })}
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="signature_block">Signature Block</Label>
          <Textarea
            id="signature_block"
            value={form.signature_block}
            disabled={!canEdit}
            rows={3}
            placeholder="Authorized Signatory&#10;Title&#10;Date"
            onChange={(e) =>
              setForm({ ...form, signature_block: e.target.value })
            }
          />
        </div>
      </section>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && (
        <p className="text-sm text-green-700">Company settings saved successfully.</p>
      )}

      {canEdit && (
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save Company Settings'}
        </Button>
      )}
    </form>
  );
}
