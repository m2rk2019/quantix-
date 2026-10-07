'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { BookmarkPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatTemplateVersionLabel } from '@/lib/master-templates/template-version';
import { saveProjectAsMasterTemplate } from '@/services/master-templates/save-master-template';
import type { ProjectStatus } from '@/types/project';

interface SaveAsMasterTemplateButtonProps {
  projectId: string;
  defaultName: string;
  /** User may manage templates (role check). */
  canManage: boolean;
  projectStatus: ProjectStatus;
}

export function SaveAsMasterTemplateButton({
  projectId,
  defaultName,
  canManage,
  projectStatus,
}: SaveAsMasterTemplateButtonProps): React.JSX.Element | null {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!canManage) return null;

  if (projectStatus !== 'approved') {
    return (
      <p className="text-xs text-muted-foreground">
        Approve this estimate to save it as a Master Template.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {!open ? (
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          <BookmarkPlus className="mr-2 h-4 w-4" />
          Save as Master Template
        </Button>
      ) : (
        <form
          className="space-y-3 rounded-lg border p-4"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setError(null);
            setSuccess(null);
            startTransition(async () => {
              const result = await saveProjectAsMasterTemplate({
                projectId,
                displayName: String(form.get('display_name') ?? ''),
                description: String(form.get('description') ?? ''),
              });
              if (!result.success) {
                setError(result.error ?? 'Failed to save template');
                return;
              }
              const ver = result.templateVersion
                ? formatTemplateVersionLabel(result.templateVersion)
                : '';
              setSuccess(
                `Saved as new Master Template ${ver}. Existing versions and this project are unchanged.`
              );
              setOpen(false);
              router.refresh();
            });
          }}
        >
          <p className="text-xs text-muted-foreground">
            Always creates a new version (v1.0, v1.1, …). Existing templates are
            never overwritten.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="display_name">Template name</Label>
            <Input
              id="display_name"
              name="display_name"
              defaultValue={`${defaultName} Master Template`}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              defaultValue="Reusable BCB master — update quantities and project-specific rates only."
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : 'Save new version'}
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
