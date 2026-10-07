import { unstable_cache } from 'next/cache';

import { companySettingsTag } from '@/lib/cache/cache-tags';
import { defaultCompanySettings } from '@/lib/company/branding';
import { parseCurrencyCode } from '@/lib/constants/currency';
import { createClient } from '@/lib/supabase/server';
import type { CompanySettings } from '@/types/company-settings';
import type { CurrencyCode } from '@/types/project';

function parseCurrency(value: string | null | undefined): CurrencyCode {
  return parseCurrencyCode(value);
}

function mapRow(row: Record<string, unknown>): CompanySettings {
  return {
    id: String(row.id),
    company_name: String(row.company_name ?? 'Quantix'),
    logo_url: (row.logo_url as string | null) ?? null,
    address: (row.address as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    website: (row.website as string | null) ?? null,
    default_currency: parseCurrency(row.default_currency as string),
    default_vat_percent: Number(row.default_vat_percent ?? 12),
    default_ocm_percent: Number(row.default_ocm_percent ?? 10),
    default_contingency_percent: Number(row.default_contingency_percent ?? 5),
    default_profit_percent: Number(row.default_profit_percent ?? 10),
    project_code_format: String(row.project_code_format ?? 'QTX-{YYYY}-{SEQ:6}'),
    report_header: (row.report_header as string | null) ?? null,
    report_footer: (row.report_footer as string | null) ?? null,
    signature_block: (row.signature_block as string | null) ?? null,
    theme_color: String(row.theme_color ?? '#1f4e79'),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

async function loadCompanySettingsFromDb(): Promise<CompanySettings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('company_settings')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return defaultCompanySettings();
  }

  return mapRow(data as Record<string, unknown>);
}

const getCachedCompanySettings = unstable_cache(
  loadCompanySettingsFromDb,
  ['company-settings-v1'],
  {
    tags: [companySettingsTag()],
    revalidate: 60,
  }
);

export async function getCompanySettings(): Promise<CompanySettings> {
  try {
    return await getCachedCompanySettings();
  } catch {
    return defaultCompanySettings();
  }
}

export async function getCompanySettingsUncached(): Promise<CompanySettings> {
  return loadCompanySettingsFromDb();
}
