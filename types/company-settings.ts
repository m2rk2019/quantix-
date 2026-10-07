import type { CurrencyCode } from './project';

export interface CompanySettings {
  id: string;
  company_name: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  default_currency: CurrencyCode;
  default_vat_percent: number;
  default_ocm_percent: number;
  default_contingency_percent: number;
  default_profit_percent: number;
  project_code_format: string;
  report_header: string | null;
  report_footer: string | null;
  signature_block: string | null;
  theme_color: string;
  updated_at: string;
}

export interface UpdateCompanySettingsInput {
  company_name: string;
  logo_url?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  default_currency: CurrencyCode;
  default_vat_percent: number;
  default_ocm_percent: number;
  default_contingency_percent: number;
  default_profit_percent: number;
  project_code_format: string;
  report_header?: string | null;
  report_footer?: string | null;
  signature_block?: string | null;
  theme_color: string;
}

/** Branding fields consumed by reports, exports, and UI chrome. */
export interface ReportBranding {
  companyName: string;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  reportHeader: string | null;
  reportFooter: string | null;
  signatureBlock: string | null;
  themeColor: string;
  themeColorExcel: string;
}
