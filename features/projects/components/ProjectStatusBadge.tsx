import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  PROJECT_STATUS_LABELS,
  type ProjectStatus,
} from '@/types/project';

const STATUS_CLASSES: Record<ProjectStatus, string> = {
  draft: 'border-transparent bg-muted text-muted-foreground',
  in_progress: 'border-transparent bg-primary/10 text-primary',
  for_review:
    'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  approved:
    'border-transparent bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
  archived: 'border-transparent bg-muted text-muted-foreground',
};

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
}

export function ProjectStatusBadge({
  status,
}: ProjectStatusBadgeProps): React.JSX.Element {
  return (
    <Badge className={cn(STATUS_CLASSES[status])}>
      {PROJECT_STATUS_LABELS[status]}
    </Badge>
  );
}
