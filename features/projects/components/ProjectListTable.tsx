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
import { formatDateTime, formatRelativeDate } from '@/lib/format';
import { ROUTES } from '@/lib/constants/routes';
import type { ProjectListItem } from '@/types/project';

interface ProjectListTableProps {
  projects: ProjectListItem[];
}

export function ProjectListTable({
  projects,
}: ProjectListTableProps): React.JSX.Element {
  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-lg font-medium">No projects found</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Try adjusting your search or filters, or create a new project.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project Code</TableHead>
            <TableHead>Project Name</TableHead>
            <TableHead>Client</TableHead>
            <TableHead className="hidden md:table-cell">Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden lg:table-cell">Created By</TableHead>
            <TableHead>Last Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id} className="cursor-pointer">
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
                  href={ROUTES.project(project.id)}
                  className="font-medium hover:text-primary hover:underline"
                >
                  {project.project_name}
                </Link>
              </TableCell>
              <TableCell>{project.client_name}</TableCell>
              <TableCell className="hidden md:table-cell">
                {project.location ?? '—'}
              </TableCell>
              <TableCell>
                <ProjectStatusBadge status={project.status} />
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {project.created_by_name}
              </TableCell>
              <TableCell
                className="text-muted-foreground"
                title={formatDateTime(project.updated_at)}
              >
                {formatRelativeDate(project.updated_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
