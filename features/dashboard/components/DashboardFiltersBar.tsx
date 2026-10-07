'use client';

import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROUTES } from '@/lib/constants/routes';
import type { EstimatorOption } from '@/types/dashboard';
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS } from '@/types/project';
import type { ProjectStatus } from '@/types/project';

const controlClass =
  'h-10 rounded-xl border-border/80 bg-white shadow-sm transition-shadow focus-visible:ring-[#E31E24]';

interface DashboardFiltersBarProps {
  initialSearch: string;
  initialClient: string;
  initialLocation: string;
  initialEstimator: string;
  initialStatus: string;
  initialDateFrom: string;
  initialDateTo: string;
  estimators: EstimatorOption[];
}

export function DashboardFiltersBar({
  initialSearch,
  initialClient,
  initialLocation,
  initialEstimator,
  initialStatus,
  initialDateFrom,
  initialDateTo,
  estimators,
}: DashboardFiltersBarProps): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(initialSearch);
  const [client, setClient] = useState(initialClient);
  const [location, setLocation] = useState(initialLocation);
  const [dateFrom, setDateFrom] = useState(initialDateFrom);
  const [dateTo, setDateTo] = useState(initialDateTo);

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
        router.push(`${ROUTES.dashboard}?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const applyAll = () => {
    applyParams({
      search: search.trim() || undefined,
      client: client.trim() || undefined,
      location: location.trim() || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
  };

  return (
    <section
      className="dashboard-fade-in rounded-2xl border border-border/60 bg-white p-4 opacity-0 shadow-sm"
      aria-label="Dashboard filters"
    >
      <div className="grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1">
          <Label htmlFor="search" className="text-xs font-medium text-muted-foreground">
            Search
          </Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Project, client, code…"
              className={`${controlClass} pl-9`}
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="client" className="text-xs font-medium text-muted-foreground">
            Client
          </Label>
          <Input
            id="client"
            value={client}
            onChange={(event) => setClient(event.target.value)}
            className={controlClass}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="location" className="text-xs font-medium text-muted-foreground">
            Location
          </Label>
          <Input
            id="location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className={controlClass}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-muted-foreground">Estimator</Label>
          <Select
            value={initialEstimator || 'all'}
            onValueChange={(value) =>
              applyParams({ estimator: value === 'all' ? undefined : value })
            }
          >
            <SelectTrigger className={controlClass}>
              <SelectValue placeholder="All estimators" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All estimators</SelectItem>
              {estimators.map((estimator) => (
                <SelectItem key={estimator.id} value={estimator.id}>
                  {estimator.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-muted-foreground">Status</Label>
          <Select
            value={initialStatus || 'all'}
            onValueChange={(value) =>
              applyParams({ status: value === 'all' ? undefined : value })
            }
          >
            <SelectTrigger className={controlClass}>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {PROJECT_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {PROJECT_STATUS_LABELS[status as ProjectStatus]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="dateFrom" className="text-xs font-medium text-muted-foreground">
            Updated from
          </Label>
          <Input
            id="dateFrom"
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className={controlClass}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="dateTo" className="text-xs font-medium text-muted-foreground">
            Updated to
          </Label>
          <Input
            id="dateTo"
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className={controlClass}
          />
        </div>
        <div className="flex h-10 items-center gap-2">
          <Button
            type="button"
            onClick={applyAll}
            disabled={isPending}
            className="h-10 flex-1 rounded-xl bg-[#E31E24] px-4 text-white shadow-sm transition-all hover:bg-[#c91a1f] hover:shadow-md focus-visible:ring-[#E31E24]"
          >
            {isPending ? 'Applying…' : 'Apply Filters'}
          </Button>
          <Button
            type="button"
            variant="outline"
            asChild
            className="h-10 rounded-xl border-gray-200 bg-white px-4 text-gray-700 hover:bg-gray-50"
          >
            <a href={ROUTES.dashboard}>Reset</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
