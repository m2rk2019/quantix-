import { notFound } from 'next/navigation';

import { PageTitle } from '@/components/layout/PageTitle';
import { FormulaAuditPanel } from '@/features/benchmark/components/FormulaAuditPanel';
import { ValidationCenterPanel } from '@/features/benchmark/components/ValidationCenterPanel';
import { BenchmarkReportsToolbar } from '@/features/benchmark/components/BenchmarkReportsToolbar';
import { ProjectDetailsTabs } from '@/features/projects/components/ProjectDetailsTabs';
import { getAuthUser } from '@/lib/auth/session';
import { getProjectById } from '@/services/projects/list-projects';
import { getFormulaAudit } from '@/services/benchmark/get-formula-audit';
import { validateHistoricalProject } from '@/services/benchmark/validate-historical';

export const dynamic = 'force-dynamic';

interface ProjectValidationPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectValidationPage({
  params,
}: ProjectValidationPageProps): Promise<React.JSX.Element> {
  const { projectId } = await params;
  const { profile } = await getAuthUser();

  if (!profile) {
    notFound();
  }

  const project = await getProjectById(projectId);
  if (!project) {
    notFound();
  }

  const [validation, formulaAudit] = await Promise.all([
    validateHistoricalProject(projectId),
    getFormulaAudit(projectId),
  ]);

  if (!validation) {
    notFound();
  }

  return (
    <div>
      <ProjectDetailsTabs projectId={projectId} />
      <PageTitle title="Validation Center" />
      <p className="mb-4 text-sm text-muted-foreground">
        {project.project_name} ({project.project_code}) — estimated vs actual comparison and formula audit.
      </p>
      <BenchmarkReportsToolbar projectId={projectId} />
      <div className="space-y-8">
        <ValidationCenterPanel result={validation} />
        {formulaAudit && <FormulaAuditPanel audit={formulaAudit} />}
      </div>
    </div>
  );
}
