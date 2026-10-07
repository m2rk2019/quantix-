import { notFound } from 'next/navigation';

import { PageTitle } from '@/components/layout/PageTitle';
import { AuditHistoryPanel } from '@/features/audit/components/AuditHistoryPanel';
import { getAuthUser } from '@/lib/auth/session';
import { listAuditHistory } from '@/services/audit/list-audit-history';
import { getProjectById } from '@/services/projects/list-projects';

export const dynamic = 'force-dynamic';

interface ProjectAuditPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectAuditPage({
  params,
}: ProjectAuditPageProps): Promise<React.JSX.Element> {
  const { projectId } = await params;
  const { profile } = await getAuthUser();

  if (!profile) {
    notFound();
  }

  const project = await getProjectById(projectId);

  if (!project) {
    notFound();
  }

  const history = await listAuditHistory(projectId);

  return (
    <div>
      <PageTitle title="Audit History" />
      <AuditHistoryPanel
        projectId={projectId}
        initialEntries={history.entries}
        initialUsers={history.users}
        initialTotal={history.total}
      />
    </div>
  );
}
