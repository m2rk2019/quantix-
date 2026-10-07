import { PageContainer } from '@/components/layout/PageContainer';
import { PageTitle } from '@/components/layout/PageTitle';
import { AdminNav } from '@/features/admin/components/AdminNav';
import { DemoPilotModule } from '@/features/demo/components/DemoPilotModule';
import { getAuthUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function DemoPilotPage(): Promise<React.JSX.Element> {
  const { profile } = await getAuthUser();

  return (
    <PageContainer>
      <PageTitle title="Local Pilot Demo" />
      <p className="mb-4 text-sm text-muted-foreground">
        One-click seed and reset for the Megawide Office Building pilot project.
        {profile && ` Signed in as ${profile.full_name}.`}
      </p>
      <AdminNav />
      <DemoPilotModule />
    </PageContainer>
  );
}
