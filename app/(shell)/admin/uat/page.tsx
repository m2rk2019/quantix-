import { PageContainer } from '@/components/layout/PageContainer';
import { PageTitle } from '@/components/layout/PageTitle';
import { AdminNav } from '@/features/admin/components/AdminNav';
import { UatModule } from '@/features/uat/components/UatModule';
import { getAuthUser } from '@/lib/auth/session';
import { getUatSuite } from '@/services/uat/get-uat-suite';

export const dynamic = 'force-dynamic';

interface UatPageProps {
  searchParams: Promise<{ projectId?: string; tab?: string }>;
}

export default async function UatPage({
  searchParams,
}: UatPageProps): Promise<React.JSX.Element> {
  const params = await searchParams;
  const { profile } = await getAuthUser();
  const data = await getUatSuite(params.projectId);

  return (
    <PageContainer>
      <PageTitle title="User Acceptance Testing" />
      <p className="mb-4 text-sm text-muted-foreground">
        Validate Quantix V1 for production deployment — checklist, formula verification,
        performance benchmarks, and test reports.
        {profile && ` Signed in as ${profile.full_name}.`}
      </p>
      <AdminNav />
      <UatModule data={data} />
    </PageContainer>
  );
}
