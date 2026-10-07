'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useCallback, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ROUTES } from '@/lib/constants/routes';
import { syncHistoricalRepositoryAction } from '@/services/historical-projects/historical-actions';

interface HistoricalProjectsToolbarProps {
  initial: {
    q?: string;
    project_name?: string;
    client?: string;
    location?: string;
    building_type?: string;
    discipline?: string;
    resource?: string;
    supplier?: string;
    date_from?: string;
    date_to?: string;
  };
  showSyncButton: boolean;
}

export function HistoricalProjectsToolbar({
  initial,
  showSyncButton,
}: HistoricalProjectsToolbarProps): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const applyParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
      params.delete('page');
      startTransition(() => {
        router.push(`${ROUTES.historical}?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const clearAll = () => {
    startTransition(() => {
      router.push(ROUTES.historical);
    });
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    applyParams({
      q: String(form.get('q') ?? '').trim() || undefined,
      project_name: String(form.get('project_name') ?? '').trim() || undefined,
      client: String(form.get('client') ?? '').trim() || undefined,
      location: String(form.get('location') ?? '').trim() || undefined,
      building_type: String(form.get('building_type') ?? '').trim() || undefined,
      discipline: String(form.get('discipline') ?? '').trim() || undefined,
      resource: String(form.get('resource') ?? '').trim() || undefined,
      supplier: String(form.get('supplier') ?? '').trim() || undefined,
      date_from: String(form.get('date_from') ?? '').trim() || undefined,
      date_to: String(form.get('date_to') ?? '').trim() || undefined,
    });
  };

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Search completed estimates archived as company knowledge.
        </p>
        {showSyncButton ? (
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                await syncHistoricalRepositoryAction();
                router.refresh();
              });
            }}
          >
            Sync completed projects
          </Button>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="space-y-3 rounded-lg border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={initial.q ?? ''}
            placeholder="Quick search name, code, client, location…"
            className="pl-9"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            name="project_name"
            defaultValue={initial.project_name ?? ''}
            placeholder="Project name"
          />
          <Input
            name="client"
            defaultValue={initial.client ?? ''}
            placeholder="Client"
          />
          <Input
            name="location"
            defaultValue={initial.location ?? ''}
            placeholder="Location"
          />
          <Input
            name="building_type"
            defaultValue={initial.building_type ?? ''}
            placeholder="Building type"
          />
          <Input
            name="discipline"
            defaultValue={initial.discipline ?? ''}
            placeholder="Discipline"
          />
          <Input
            name="resource"
            defaultValue={initial.resource ?? ''}
            placeholder="Resource"
          />
          <Input
            name="supplier"
            defaultValue={initial.supplier ?? ''}
            placeholder="Supplier"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              name="date_from"
              type="date"
              defaultValue={initial.date_from ?? ''}
              aria-label="Date from"
            />
            <Input
              name="date_to"
              type="date"
              defaultValue={initial.date_to ?? ''}
              aria-label="Date to"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isPending}>
            Search
          </Button>
          <Button type="button" variant="ghost" onClick={clearAll}>
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        </div>
      </form>
    </div>
  );
}
