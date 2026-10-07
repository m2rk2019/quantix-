'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/lib/constants/routes';
import { cloneHistoricalProjectAction } from '@/services/historical-projects/historical-actions';

interface CloneHistoricalProjectButtonProps {
  historicalProjectId: string;
  defaultName: string;
  defaultClient: string;
  defaultLocation: string | null;
  canClone: boolean;
}

export function CloneHistoricalProjectButton({
  historicalProjectId,
  defaultName,
  defaultClient,
  defaultLocation,
  canClone,
}: CloneHistoricalProjectButtonProps): React.JSX.Element | null {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!canClone) {
    return null;
  }

  return (
    <div className="space-y-3">
      {!open ? (
        <Button type="button" onClick={() => setOpen(true)}>
          <Copy className="mr-2 h-4 w-4" />
          Clone into new project
        </Button>
      ) : (
        <form
          className="space-y-3 rounded-lg border p-4"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setError(null);
            startTransition(async () => {
              const result = await cloneHistoricalProjectAction(
                historicalProjectId,
                form
              );
              if (!result.success || !result.projectId) {
                setError(result.error ?? 'Clone failed');
                return;
              }
              router.push(ROUTES.project(result.projectId));
            });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="project_name">New project name</Label>
            <Input
              id="project_name"
              name="project_name"
              defaultValue={`${defaultName} (Clone)`}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="client_name">Client</Label>
            <Input
              id="client_name"
              name="client_name"
              defaultValue={defaultClient}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              defaultValue={defaultLocation ?? ''}
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Cloning…' : 'Create clone'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={isPending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
