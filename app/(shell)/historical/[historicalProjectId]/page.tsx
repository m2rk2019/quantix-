import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageContainer } from '@/components/layout/PageContainer';
import { PageTitle } from '@/components/layout/PageTitle';
import { Badge } from '@/components/ui/badge';
import { CloneHistoricalProjectButton } from '@/features/historical-projects/components/CloneHistoricalProjectButton';
import { canCreateProject, isAdminOrAbove } from '@/lib/auth/permissions';
import { getAuthUser } from '@/lib/auth/session';
import { ROUTES } from '@/lib/constants/routes';
import { formatCurrencyPHP } from '@/lib/format-currency';
import { formatDateTime } from '@/lib/format';
import { getHistoricalProjectById } from '@/services/historical-projects/get-historical-project';
import {
  HISTORICAL_SNAPSHOT_SECTION_LABELS,
  type HistoricalSnapshotSection,
} from '@/types/historical-project';

export const dynamic = 'force-dynamic';

interface HistoricalProjectDetailPageProps {
  params: Promise<{ historicalProjectId: string }>;
  searchParams: Promise<{ error?: string }>;
}

function sectionCounts(
  payload: Record<string, unknown>,
  section: HistoricalSnapshotSection
): string {
  if (section === 'wbs') {
    const nodes = Array.isArray(payload.nodes) ? payload.nodes.length : 0;
    return `${nodes} nodes`;
  }
  if (section === 'boq') {
    const items = Array.isArray(payload.items) ? payload.items.length : 0;
    const lines = Array.isArray(payload.rate_analysis_lines)
      ? payload.rate_analysis_lines.length
      : 0;
    return `${items} items · ${lines} rate lines`;
  }
  if (section === 'project_resource_library') {
    const items = Array.isArray(payload.items) ? payload.items.length : 0;
    return `${items} resources`;
  }
  if (section === 'ai_outputs') {
    const events = Array.isArray(payload.events) ? payload.events.length : 0;
    return `${events} AI events`;
  }
  if (section === 'estimate_summary') {
    const summary = payload.summary as { grand_total?: number } | null;
    return summary?.grand_total != null
      ? formatCurrencyPHP(Number(summary.grand_total))
      : 'Captured';
  }
  if (section === 'executive_reports') {
    return 'KPI snapshot';
  }
  return 'Captured';
}

export default async function HistoricalProjectDetailPage({
  params,
  searchParams,
}: HistoricalProjectDetailPageProps): Promise<React.JSX.Element> {
  const { historicalProjectId } = await params;
  const { error } = await searchParams;
  const { profile } = await getAuthUser();
  const project = await getHistoricalProjectById(historicalProjectId);

  if (!project) {
    notFound();
  }

  const canClone = profile ? canCreateProject(profile.role) : false;

  return (
    <PageContainer>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <PageTitle title={project.project_name} />
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-mono">{project.project_code}</span>
            {' · '}
            {project.client_name}
            {project.location ? ` · ${project.location}` : ''}
          </p>
        </div>
        <CloneHistoricalProjectButton
          historicalProjectId={project.id}
          defaultName={project.project_name}
          defaultClient={project.client_name}
          defaultLocation={project.location}
          canClone={canClone}
        />
      </div>

      {error ? (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Grand total</p>
          <p className="text-lg font-semibold tabular-nums">
            {formatCurrencyPHP(project.grand_total)}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Building type</p>
          <p className="font-medium capitalize">
            {project.building_type?.replaceAll('_', ' ') ?? '—'}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Estimate date</p>
          <p className="font-medium">
            {project.estimate_date
              ? formatDateTime(project.estimate_date)
              : '—'}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Archive version</p>
          <p className="font-medium">v{project.archive_version}</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {project.discipline_tags.map((tag) => (
          <Badge key={`d-${tag}`} variant="secondary">
            {tag}
          </Badge>
        ))}
        {project.supplier_tags.slice(0, 6).map((tag) => (
          <Badge key={`s-${tag}`} variant="outline">
            {tag}
          </Badge>
        ))}
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Archived sections
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {project.snapshots.map((snapshot) => (
          <div key={snapshot.section} className="rounded-lg border p-4">
            <p className="font-medium">
              {HISTORICAL_SNAPSHOT_SECTION_LABELS[snapshot.section]}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {sectionCounts(snapshot.payload, snapshot.section)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Captured {formatDateTime(snapshot.created_at)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-4 text-sm">
        {project.source_project_id ? (
          <Link
            href={ROUTES.project(project.source_project_id)}
            className="text-primary hover:underline"
          >
            Open live source project
          </Link>
        ) : null}
        <Link href={ROUTES.historical} className="text-muted-foreground hover:underline">
          Back to historical list
        </Link>
        {profile && isAdminOrAbove(profile.role) ? (
          <span className="text-xs text-muted-foreground">
            Benchmark-eligible · Cost-intelligence ready
          </span>
        ) : null}
      </div>
    </PageContainer>
  );
}
