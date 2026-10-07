'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

import { companySettingsTag } from '@/lib/cache/cache-tags';
import { normalizeThemeColor } from '@/lib/company/branding';
import { requireProvisionedUserProfile } from '@/lib/auth/session';
import { canManageCompanySettings } from '@/lib/auth/permissions';
import { logger } from '@/lib/logging/logger';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/services/audit/log-audit-event';
import { getCompanySettingsUncached } from '@/services/company-settings/get-company-settings';
import { parseCurrencyCode } from '@/lib/constants/currency';
import { ROUTES } from '@/lib/constants/routes';
import type { UpdateCompanySettingsInput } from '@/types/company-settings';
import type { CurrencyCode } from '@/types/project';

export interface CompanySettingsActionResult {
  ok: boolean;
  error?: string;
}

function parseCurrency(value: string): CurrencyCode {
  return parseCurrencyCode(value);
}

export async function updateCompanySettingsAction(
  input: UpdateCompanySettingsInput
): Promise<CompanySettingsActionResult> {
  let profile;

  try {
    profile = await requireProvisionedUserProfile();
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unauthorized',
    };
  }

  if (!canManageCompanySettings(profile.role)) {
    return { ok: false, error: 'You do not have permission to manage company settings.' };
  }

  if (!input.company_name.trim()) {
    return { ok: false, error: 'Company name is required.' };
  }

  const supabase = await createClient();
  const existing = await getCompanySettingsUncached();

  const payload = {
    company_name: input.company_name.trim(),
    logo_url: input.logo_url?.trim() || null,
    address: input.address?.trim() || null,
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    website: input.website?.trim() || null,
    default_currency: parseCurrency(input.default_currency),
    default_vat_percent: input.default_vat_percent,
    default_ocm_percent: input.default_ocm_percent,
    default_contingency_percent: input.default_contingency_percent,
    default_profit_percent: input.default_profit_percent,
    project_code_format: input.project_code_format.trim() || 'QTX-{YYYY}-{SEQ:6}',
    report_header: input.report_header?.trim() || null,
    report_footer: input.report_footer?.trim() || null,
    signature_block: input.signature_block?.trim() || null,
    theme_color: normalizeThemeColor(input.theme_color),
    updated_by: profile.id,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('company_settings')
    .update(payload)
    .eq('id', existing.id);

  if (error) {
    logger.error('Failed to update company settings', error);
    return { ok: false, error: error.message };
  }

  await logAuditEvent({
    projectId: null,
    entityType: 'company_settings',
    entityId: existing.id,
    action: 'company_settings.updated',
    actorId: profile.id,
    module: 'admin',
    oldValue: existing.company_name,
    newValue: payload.company_name,
    remarks: 'Company settings updated',
    payload: { company_name: payload.company_name },
  });

  revalidateTag(companySettingsTag(), { expire: 0 });
  revalidatePath(ROUTES.dashboard);
  revalidatePath(ROUTES.adminSettings);

  return { ok: true };
}
