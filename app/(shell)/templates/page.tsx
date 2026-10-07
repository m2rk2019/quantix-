import { PageContainer } from '@/components/layout/PageContainer';
import { PageTitle } from '@/components/layout/PageTitle';
import { MasterTemplatesPanel } from '@/features/master-templates/components/MasterTemplatesPanel';
import { canCreateProject } from '@/lib/auth/permissions';
import { getAuthUser } from '@/lib/auth/session';
import { listMasterTemplates } from '@/services/master-templates/list-master-templates';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/constants/routes';

export const dynamic = 'force-dynamic';

export default async function MasterTemplatesPage(): Promise<React.JSX.Element> {
  const { profile } = await getAuthUser();
  if (!profile || !canCreateProject(profile.role)) {
    redirect(ROUTES.unauthorized);
  }

  const templates = await listMasterTemplates();

  return (
    <PageContainer>
      <PageTitle title="Master Templates" />
      <p className="mb-6 text-sm text-muted-foreground">
        Save approved estimates as versioned Master Templates (v1.0, v1.1, … —
        never overwritten). Create projects from any exact version; each project
        permanently stores that template id and version. Import a new Excel BCB to
        auto-compare BOQ items and reuse company rates.
      </p>
      <MasterTemplatesPanel
        templates={templates}
        canCreate={canCreateProject(profile.role)}
      />
    </PageContainer>
  );
}
