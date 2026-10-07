import Link from 'next/link';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrencyPHP } from '@/lib/format-currency';
import { formatDateTime, formatRelativeDate } from '@/lib/format';
import { ROUTES } from '@/lib/constants/routes';
import type { HistoricalProjectListItem } from '@/types/historical-project';

interface HistoricalProjectsTableProps {
  projects: HistoricalProjectListItem[];
}

export function HistoricalProjectsTable({
  projects,
}: HistoricalProjectsTableProps): React.JSX.Element {
  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-lg font-medium">No historical projects found</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Approve or archive a completed estimate to capture it here. Admins can
          also sync existing completed projects.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Client</TableHead>
            <TableHead className="hidden md:table-cell">Location</TableHead>
            <TableHead className="hidden lg:table-cell">Building type</TableHead>
            <TableHead className="text-right">Grand total</TableHead>
            <TableHead className="hidden lg:table-cell">Estimate date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-mono font-medium">
                <Link
                  href={ROUTES.historicalProject(project.id)}
                  className="hover:text-primary hover:underline"
                >
                  {project.project_code}
                </Link>
              </TableCell>
              <TableCell>
                <Link
                  href={ROUTES.historicalProject(project.id)}
                  className="font-medium hover:text-primary hover:underline"
                >
                  {project.project_name}
                </Link>
                {project.discipline_tags.length > 0 ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {project.discipline_tags.slice(0, 3).join(' · ')}
                  </p>
                ) : null}
              </TableCell>
              <TableCell>{project.client_name}</TableCell>
              <TableCell className="hidden md:table-cell">
                {project.location ?? '—'}
              </TableCell>
              <TableCell className="hidden lg:table-cell capitalize">
                {project.building_type?.replaceAll('_', ' ') ?? '—'}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrencyPHP(project.grand_total)}
              </TableCell>
              <TableCell
                className="hidden text-muted-foreground lg:table-cell"
                title={
                  project.estimate_date
                    ? formatDateTime(project.estimate_date)
                    : undefined
                }
              >
                {project.estimate_date
                  ? formatRelativeDate(project.estimate_date)
                  : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
