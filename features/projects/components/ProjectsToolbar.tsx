'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useCallback, useEffect, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROUTES } from '@/lib/constants/routes';
import { PROJECTS_SEARCH_DEBOUNCE_MS } from '@/lib/performance/constants';
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  type ProjectStatus,
} from '@/types/project';

interface ProjectsToolbarProps {
  initialSearch?: string;
  initialStatus?: ProjectStatus;
  initialSort?: string;
  initialOrder?: 'asc' | 'desc';
  showCreateButton: boolean;
}

export function ProjectsToolbar({
  initialSearch = '',
  initialStatus,
  initialSort = 'updated_at',
  initialOrder = 'desc',
  showCreateButton,
}: ProjectsToolbarProps): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);

  const applyParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      params.delete('page');

      startTransition(() => {
        router.push(`${ROUTES.projects}?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search !== initialSearch) {
        applyParams({ search: search.trim() || undefined });
      }
    }, PROJECTS_SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search, initialSearch, applyParams]);

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, code, client, or location…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                applyParams({ search: search.trim() || undefined });
              }
            }}
            className="pl-9 pr-9"
          />
          {search && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={() => {
                setSearch('');
                applyParams({ search: undefined });
              }}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={initialStatus ?? 'all'}
            onValueChange={(value) =>
              applyParams({
                status: value === 'all' ? undefined : value,
              })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {PROJECT_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {PROJECT_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={`${initialSort}-${initialOrder}`}
            onValueChange={(value) => {
              const [sort, order] = value.split('-') as [string, 'asc' | 'desc'];
              applyParams({ sort, order });
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_at-desc">Last updated ↓</SelectItem>
              <SelectItem value="updated_at-asc">Last updated ↑</SelectItem>
              <SelectItem value="project_code-asc">Project code ↑</SelectItem>
              <SelectItem value="project_name-asc">Project name ↑</SelectItem>
              <SelectItem value="client_name-asc">Client ↑</SelectItem>
              <SelectItem value="status-asc">Status ↑</SelectItem>
            </SelectContent>
          </Select>

          {showCreateButton && (
            <>
              <Button asChild variant="outline">
                <a href={ROUTES.projectImport}>Import Excel</a>
              </Button>
              <Button asChild>
                <a href={ROUTES.projectNew}>+ Create Project</a>
              </Button>
            </>
          )}
        </div>
      </div>

      {isPending && (
        <p className="text-sm text-muted-foreground">Updating list…</p>
      )}
    </div>
  );
}
