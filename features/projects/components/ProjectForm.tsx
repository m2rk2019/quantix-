'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProjectStatusBadge } from '@/features/projects/components/ProjectStatusBadge';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';
import { createProject } from '@/services/projects/create-project';

export function ProjectForm(): React.JSX.Element {
  const router = useRouter();
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    if (!projectName.trim()) {
      nextErrors.project_name = 'Project name is required';
    }
    if (!clientName.trim()) {
      nextErrors.client_name = 'Client is required';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const result = await createProject({
      project_name: projectName,
      client_name: clientName,
      location,
      description,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setFormError(result.error ?? 'Something went wrong');
      return;
    }

    if (result.projectId) {
      router.push(ROUTES.project(result.projectId));
      router.refresh();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Information</CardTitle>
        <CardDescription>
          Project code is auto-generated on save (QTX-YYYY-######).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project_code">Project Code</Label>
              <Input
                id="project_code"
                value="Auto-generated (QTX-YYYY-######)"
                disabled
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex h-9 items-center">
                <ProjectStatusBadge status="draft" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project_name">
              Project Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="project_name"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              disabled={isSubmitting}
              className={cn(errors.project_name && 'border-destructive')}
            />
            {errors.project_name ? (
              <p className="text-sm text-destructive">{errors.project_name}</p>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client_name">
                Client <span className="text-destructive">*</span>
              </Label>
              <Input
                id="client_name"
                value={clientName}
                onChange={(event) => setClientName(event.target.value)}
                disabled={isSubmitting}
                className={cn(errors.client_name && 'border-destructive')}
              />
              {errors.client_name ? (
                <p className="text-sm text-destructive">{errors.client_name}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={isSubmitting}
              rows={4}
            />
          </div>

          {formError ? (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Create Project
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(ROUTES.projects)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
