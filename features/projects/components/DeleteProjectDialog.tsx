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
import { deleteProject } from '@/services/projects/delete-project';
import { ROUTES } from '@/lib/constants/routes';
import { clearRecentProjectId } from '@/lib/navigation/recent-project';

interface DeleteProjectDialogProps {
  projectId: string;
  projectCode: string;
}

export function DeleteProjectDialog({
  projectId,
  projectCode,
}: DeleteProjectDialogProps): React.JSX.Element {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleDelete(): Promise<void> {
    setIsLoading(true);
    setError(null);

    const result = await deleteProject(projectId);
    setIsLoading(false);

    if (!result.success) {
      setError(result.error ?? 'Failed to delete project');
      return;
    }

    setOpen(false);
    clearRecentProjectId();
    router.push(ROUTES.projects);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="destructive">
          Delete Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete project</DialogTitle>
          <DialogDescription>
            Delete &quot;{projectCode}&quot;? This soft-deletes the project and
            it will no longer appear in lists. This action cannot be undone from
            the UI.
          </DialogDescription>
        </DialogHeader>

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
            variant="destructive"
            onClick={() => void handleDelete()}
            disabled={isLoading}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
