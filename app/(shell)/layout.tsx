import { redirect } from 'next/navigation';

import { AppShell } from '@/components/layout/AppShell';
import { CompanyThemeProvider } from '@/components/providers/CompanyThemeProvider';
import { getAuthUser } from '@/lib/auth/session';
import { validateProductionEnv } from '@/lib/env/validate';
import { ROUTES } from '@/lib/constants/routes';
import { getCompanySettings } from '@/services/company-settings/get-company-settings';

export const dynamic = 'force-dynamic';

export default async function ShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.JSX.Element> {
  validateProductionEnv();
  const { profile } = await getAuthUser();

  if (!profile) {
    redirect(ROUTES.login);
  }

  const company = await getCompanySettings();

  return (
    <>
      <CompanyThemeProvider themeColor={company.theme_color} />
      <AppShell user={profile} company={company}>
        {children}
      </AppShell>
    </>
  );
}
