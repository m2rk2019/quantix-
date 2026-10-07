import type { CompanySettings, ReportBranding } from '@/types/company-settings';
import { LOGO_PATH } from '@/lib/branding';
import { DEFAULT_CURRENCY } from '@/lib/format-currency';

export const DEFAULT_THEME_COLOR = '#E31E24';
export const DEFAULT_COMPANY_NAME = 'Quantix';

export function hexToExcelArgb(hex: string): string {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 6) {
    return `FF${clean.toUpperCase()}`;
  }
  return 'FFD71920';
}

export function normalizeThemeColor(hex: string): string {
  const trimmed = hex.trim();
  if (!trimmed) {
    return DEFAULT_THEME_COLOR;
  }
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

export function lightenHexForExcel(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) {
    return 'FFD9E2F3';
  }
  const r = Math.min(255, parseInt(clean.slice(0, 2), 16) + 80);
  const g = Math.min(255, parseInt(clean.slice(2, 4), 16) + 80);
  const b = Math.min(255, parseInt(clean.slice(4, 6), 16) + 80);
  const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
  return `FF${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function toReportBranding(settings: CompanySettings): ReportBranding {
  const themeColor = normalizeThemeColor(settings.theme_color);
  return {
    companyName: settings.company_name,
    logoUrl: settings.logo_url ?? LOGO_PATH,
    address: settings.address,
    phone: settings.phone,
    email: settings.email,
    website: settings.website,
    reportHeader: settings.report_header,
    reportFooter: settings.report_footer,
    signatureBlock: settings.signature_block,
    themeColor,
    themeColorExcel: hexToExcelArgb(themeColor),
  };
}

export function defaultCompanySettings(): CompanySettings {
  return {
    id: 'default',
    company_name: DEFAULT_COMPANY_NAME,
    logo_url: LOGO_PATH,
    address: null,
    phone: null,
    email: null,
    website: null,
    default_currency: DEFAULT_CURRENCY,
    default_vat_percent: 12,
    default_ocm_percent: 10,
    default_contingency_percent: 5,
    default_profit_percent: 10,
    project_code_format: 'QTX-{YYYY}-{SEQ:6}',
    report_header: null,
    report_footer: null,
    signature_block: null,
    theme_color: DEFAULT_THEME_COLOR,
    updated_at: new Date().toISOString(),
  };
}
