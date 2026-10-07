'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { transitionProjectStatus } from '@/services/projects/transition-project-status';
import type { ProjectLifecycleAction, ProjectStatus } from '@/types/project';
import {
  canPerformLifecycleAction,
  PROJECT_STATUS_LABELS,
} from '@/types/project';
import type { UserRole } from '@/types/auth';

interface LifecycleActionConfig {
  action: ProjectLifecycleAction;
  label: string;
  variant?: 'default' | 'outline' | 'destructive';
  needsReason?: boolean;
}

const ACTION_CONFIG: Record<ProjectStatus, LifecycleActionConfig[]> = {
  draft: [{ action: 'start', label: 'Start estimating' }],
  in_progress: [{ action: 'submit', label: 'Submit for review' }],
  for_review: [
    { action: 'approve', label: 'Approve', variant: 'default' },
    {
      action: 'reject',
      label: 'Reject',
      variant: 'outline',
      needsReason: true,
    },
  ],
  approved: [
    { action: 'archive', label: 'Archive', variant: 'outline' },
  ],
  archived: [
    {
      action: 'restore',
      label: 'Restore from archive',
      variant: 'outline',
      needsReason: true,
    },
  ],
};

interface ProjectLifecycleActionsProps {
  projectId: string;
  status: ProjectStatus;
  role: UserRole;
  isOwner: boolean;
}

export function ProjectLifecycleActions({
  projectId,
  status,
  role,
  isOwner,
}: ProjectLifecycleActionsProps): React.JSX.Element | null {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pendingAction, setPendingAction] =
    useState<LifecycleActionConfig | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const actions = ACTION_CONFIG[status].filter((config) =>
    canPerformLifecycleAction(role, config.action, status, isOwner)
  );

  if (actions.length === 0) {
    return null;
  }

  async function handleConfirm(): Promise<void> {
    if (!pendingAction) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await transitionProjectStatus(
      projectId,
      pendingAction.action,
      reason
    );

    setIsLoading(false);

    if (!result.success) {
      setError(result.error ?? 'Action failed');
      return;
    }

    setOpen(false);
    setPendingAction(null);
    setReason('');
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((config) => (
        <Button
          key={config.action}
          type="button"
          variant={config.variant ?? 'default'}
          onClick={() => {
            if (config.needsReason) {
              setPendingAction(config);
              setOpen(true);
            } else {
              void (async () => {
                setIsLoading(true);
                const result = await transitionProjectStatus(
                  projectId,
                  config.action
                );
                setIsLoading(false);
                if (result.success) {
                  router.refresh();
                }
              })();
            }
          }}
          disabled={isLoading}
        >
          {config.label}
        </Button>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <span className="hidden" />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pendingAction?.label}</DialogTitle>
            <DialogDescription>
              Current status: {PROJECT_STATUS_LABELS[status]}. This action will
              update the project lifecycle.
            </DialogDescription>
          </DialogHeader>

          {pendingAction?.needsReason && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (required)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Enter reason for this action…"
                rows={3}
              />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={isLoading}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
