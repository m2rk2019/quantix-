import { MegawideLogo } from '@/components/branding/MegawideLogo';
import { QuantixLogo } from '@/components/branding/QuantixLogo';
import {
  APP_VERSION,
  LOGO_PATH,
  MEGAWIDE_COPYRIGHT_LINE,
  MEGAWIDE_RIGHTS_LINE,
} from '@/lib/branding';
import type { ReportBranding } from '@/types/company-settings';

interface ReportBrandingHeaderProps {
  branding: ReportBranding;
  subtitle?: string;
  children?: React.ReactNode;
}

export function ReportBrandingHeader({
  branding,
  subtitle,
  children,
}: ReportBrandingHeaderProps): React.JSX.Element {
  const usesDefaultLogo = !branding.logoUrl || branding.logoUrl === LOGO_PATH;

  return (
    <header className="border-b pb-4" style={{ borderColor: branding.themeColor }}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {branding.reportHeader && (
            <p className="text-xs uppercase tracking-widest text-gray-500">
              {branding.reportHeader}
            </p>
          )}
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: branding.themeColor }}
          >
            {subtitle ?? branding.companyName}
          </p>
          {children}
        </div>
        {usesDefaultLogo ? (
          <QuantixLogo variant="full" width={200} className="max-h-14" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={branding.logoUrl!}
            alt={`${branding.companyName} logo`}
            className="h-14 max-w-[200px] object-contain object-right"
          />
        )}
      </div>
      {(branding.address || branding.phone || branding.email) && (
        <p className="mt-2 text-xs text-gray-500">
          {[branding.address, branding.phone, branding.email]
            .filter(Boolean)
            .join(' · ')}
        </p>
      )}
    </header>
  );
}

interface ReportBrandingFooterProps {
  branding: ReportBranding;
}

export function ReportBrandingFooter({
  branding,
}: ReportBrandingFooterProps): React.JSX.Element {
  return (
    <footer className="border-t pt-4 text-sm text-gray-600">
      {branding.reportFooter && <p>{branding.reportFooter}</p>}
      {branding.signatureBlock && (
        <pre className="mt-4 whitespace-pre-wrap font-sans text-sm">
          {branding.signatureBlock}
        </pre>
      )}
      <div className="mt-6 border-t border-gray-200 pt-4 print:break-inside-avoid">
        <MegawideLogo />
        <p className="mt-2 text-xs leading-relaxed text-[#6B7280]">
          {MEGAWIDE_COPYRIGHT_LINE}
          <br />
          {MEGAWIDE_RIGHTS_LINE}
          <br />
          {APP_VERSION}
        </p>
      </div>
    </footer>
  );
}
