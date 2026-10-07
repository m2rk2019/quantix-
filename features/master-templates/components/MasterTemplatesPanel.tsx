'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ROUTES } from '@/lib/constants/routes';
import { formatDateTime } from '@/lib/format';
import { formatTemplateVersionLabel } from '@/lib/master-templates/template-version';
import { createProjectFromMasterTemplate } from '@/services/master-templates/create-from-template';
import type { MasterTemplateListItem } from '@/types/master-template';

interface MasterTemplatesPanelProps {
  templates: MasterTemplateListItem[];
  canCreate: boolean;
}

export function MasterTemplatesPanel({
  templates,
  canCreate,
}: MasterTemplatesPanelProps): React.JSX.Element {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (templates.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center">
        <p className="font-medium">No master templates yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Approve an estimate, then use <strong>Save as Master Template</strong> on
          the project overview.
        </p>
      </div>
    );
  }

  const selected = templates.find((row) => row.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Template</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>WBS</TableHead>
              <TableHead>BOQ</TableHead>
              <TableHead>Resources</TableHead>
              <TableHead>Created</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell>
                  <p className="font-medium">{template.display_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {template.description ?? '—'}
                    {template.is_latest_version ? ' · Latest' : ''}
                  </p>
                </TableCell>
                <TableCell className="font-medium tabular-nums">
                  {formatTemplateVersionLabel(template.template_version)}
                </TableCell>
                <TableCell>{template.wbs_count}</TableCell>
                <TableCell>{template.boq_count}</TableCell>
                <TableCell>{template.resource_count}</TableCell>
                <TableCell className="text-muted-foreground">
                  <div>{formatDateTime(template.created_at)}</div>
                  <div className="text-xs">{template.created_by_name}</div>
                </TableCell>
                <TableCell>
                  {canCreate ? (
                    <Button
                      type="button"
                      size="sm"
                      variant={selectedId === template.id ? 'default' : 'outline'}
                      onClick={() => setSelectedId(template.id)}
                    >
                      <Copy className="mr-1 h-3.5 w-3.5" />
                      Use
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selected && canCreate ? (
        <form
          className="space-y-3 rounded-lg border p-4"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setError(null);
            startTransition(async () => {
              const result = await createProjectFromMasterTemplate({
                templateId: selected.id,
                projectName: String(form.get('project_name') ?? ''),
                clientName: String(form.get('client_name') ?? ''),
                location: String(form.get('location') ?? '') || null,
              });
              if (!result.success || !result.projectId) {
                setError(result.error ?? 'Failed to create project');
                return;
              }
              router.push(ROUTES.project(result.projectId));
            });
          }}
        >
          <h3 className="font-medium">
            Create project from: {selected.display_name}{' '}
            {formatTemplateVersionLabel(selected.template_version)}
          </h3>
          <p className="text-sm text-muted-foreground">
            Copies WBS, BOQ structure, Resource Library, Rate Library, Rate Analysis,
            and estimate settings from this exact version. The project permanently
            stores the template id and version. After creation, import a new Excel
            BCB on the project overview to auto-compare and reuse company rates.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="project_name">Project name</Label>
              <Input
                id="project_name"
                name="project_name"
                defaultValue={`${selected.display_name.replace(/ Master Template$/i, '')} — New Project`}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="client_name">Client</Label>
              <Input id="client_name" name="client_name" defaultValue="Client" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" />
            </div>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Creating…' : 'Create project from template'}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
