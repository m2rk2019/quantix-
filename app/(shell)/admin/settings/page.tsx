import { PageContainer } from '@/components/layout/PageContainer';
import { PageTitle } from '@/components/layout/PageTitle';
import { AdminNav } from '@/features/admin/components/AdminNav';
import { CompanySettingsForm } from '@/features/admin/components/CompanySettingsForm';
import { canManageCompanySettings } from '@/lib/auth/permissions';
import { getAuthUser } from '@/lib/auth/session';
import { getCompanySettings } from '@/services/company-settings/get-company-settings';

export const dynamic = 'force-dynamic';

export default async function CompanySettingsPage(): Promise<React.JSX.Element> {
  const { profile } = await getAuthUser();
  const settings = await getCompanySettings();
  const canEdit = profile ? canManageCompanySettings(profile.role) : false;

  return (
    <PageContainer>
      <PageTitle title="Company Settings" />
      <p className="mb-4 text-sm text-muted-foreground">
        Company profile, estimating defaults, and report branding applied across
        estimates, exports, and the executive dashboard.
      </p>
      <AdminNav />
      <CompanySettingsForm initial={settings} canEdit={canEdit} />
    </PageContainer>
  );
}
