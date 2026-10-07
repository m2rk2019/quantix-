import Link from 'next/link';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ProjectStatusBadge } from '@/features/projects/components/ProjectStatusBadge';
import { formatCurrency } from '@/lib/format-currency';
import { formatRelativeDate } from '@/lib/format';
import { ROUTES } from '@/lib/constants/routes';
import { EXECUTIVE_STATUS_LABELS } from '@/types/dashboard';
import type { DashboardProjectRow } from '@/types/dashboard';

interface PortfolioProjectsTableProps {
  projects: DashboardProjectRow[];
}

export function PortfolioProjectsTable({
  projects,
}: PortfolioProjectsTableProps): React.JSX.Element {
  if (projects.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-white p-12 text-center shadow-sm">
        <p className="text-lg font-medium">No projects in this view</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Adjust filters or create a new project to populate the dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border/60 bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04),0_6px_20px_rgb(0_0_0/0.05)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Project</TableHead>
            <TableHead className="hidden md:table-cell">Client</TableHead>
            <TableHead className="hidden lg:table-cell">Estimator</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden sm:table-cell">Executive</TableHead>
            <TableHead numeric>Grand Total</TableHead>
            <TableHead className="hidden md:table-cell">Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-mono font-medium">
                <Link
                  href={ROUTES.project(project.id)}
                  className="hover:text-primary hover:underline"
                >
                  {project.project_code}
                </Link>
              </TableCell>
              <TableCell>
                <Link
                  href={ROUTES.projectSummary(project.id)}
                  className="font-medium hover:text-primary hover:underline"
                >
                  {project.project_name}
                </Link>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {project.client_name}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {project.created_by_name}
              </TableCell>
              <TableCell>
                <ProjectStatusBadge status={project.status} />
              </TableCell>
              <TableCell className="hidden text-sm sm:table-cell">
                {EXECUTIVE_STATUS_LABELS[project.executive_status]}
              </TableCell>
              <TableCell numeric>
                {formatCurrency(project.grand_total, project.currency)}
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {formatRelativeDate(project.updated_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
