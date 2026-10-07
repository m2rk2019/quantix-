'use client';

import { Download, Loader2 } from 'lucide-react';
import { useCallback, useMemo, useState, useTransition } from 'react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatRoleLabel } from '@/lib/audit/constants';
import { loadAuditHistoryAction } from '@/services/audit/audit-actions';
import type {
  AuditHistoryEntry,
  AuditHistoryFilters,
  AuditModule,
} from '@/types/audit';
import { AUDIT_MODULE_LABELS, AUDIT_MODULES } from '@/types/audit';

interface AuditHistoryPanelProps {
  projectId: string;
  initialEntries: AuditHistoryEntry[];
  initialUsers: Array<{ id: string; fullName: string }>;
  initialTotal: number;
}

const ALL_USERS = 'all';
const ALL_MODULES = 'all';

function displayValue(value: string | null): string {
  return value && value.trim() !== '' ? value : '—';
}

export function AuditHistoryPanel({
  projectId,
  initialEntries,
  initialUsers,
  initialTotal,
}: AuditHistoryPanelProps): React.JSX.Element {
  const [entries, setEntries] = useState(initialEntries);
  const [total, setTotal] = useState(initialTotal);
  const [userId, setUserId] = useState(ALL_USERS);
  const [module, setModule] = useState<string>(ALL_MODULES);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isPending, startTransition] = useTransition();

  const filters = useMemo((): AuditHistoryFilters => {
    const next: AuditHistoryFilters = {};

    if (userId !== ALL_USERS) {
      next.userId = userId;
    }

    if (module !== ALL_MODULES) {
      next.module = module as AuditModule;
    }

    if (dateFrom) {
      next.dateFrom = dateFrom;
    }

    if (dateTo) {
      next.dateTo = dateTo;
    }

    return next;
  }, [userId, module, dateFrom, dateTo]);

  const applyFilters = useCallback(() => {
    startTransition(async () => {
      const result = await loadAuditHistoryAction(projectId, filters);
      setEntries(result.entries);
      setTotal(result.total);
    });
  }, [projectId, filters]);

  const clearFilters = useCallback(() => {
    setUserId(ALL_USERS);
    setModule(ALL_MODULES);
    setDateFrom('');
    setDateTo('');
    startTransition(async () => {
      const result = await loadAuditHistoryAction(projectId, {});
      setEntries(result.entries);
      setTotal(result.total);
    });
  }, [projectId]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Audit History</CardTitle>
          <CardDescription>
            Track estimate changes across project details, WBS, BOQ, and
            settings.
          </CardDescription>
        </div>
        <Button type="button" variant="outline" disabled title="Export coming in a future release">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="audit-user-filter">User</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger id="audit-user-filter">
                <SelectValue placeholder="All users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_USERS}>All users</SelectItem>
                {initialUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="audit-module-filter">Module</Label>
            <Select value={module} onValueChange={setModule}>
              <SelectTrigger id="audit-module-filter">
                <SelectValue placeholder="All modules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_MODULES}>All modules</SelectItem>
                {AUDIT_MODULES.map((moduleId) => (
                  <SelectItem key={moduleId} value={moduleId}>
                    {AUDIT_MODULE_LABELS[moduleId]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="audit-date-from">Date from</Label>
            <Input
              id="audit-date-from"
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="audit-date-to">Date to</Label>
            <Input
              id="audit-date-to"
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={applyFilters} disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Apply filters
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={clearFilters}
            disabled={isPending}
          >
            Clear
          </Button>
          <p className="self-center text-sm text-muted-foreground">
            {total} event{total === 1 ? '' : 's'}
          </p>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Old Value</TableHead>
                <TableHead>New Value</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No audit events match the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap">
                      {entry.date}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {entry.time}
                    </TableCell>
                    <TableCell>{entry.userName}</TableCell>
                    <TableCell>
                      {formatRoleLabel(entry.userRole ?? undefined)}
                    </TableCell>
                    <TableCell>{entry.moduleLabel}</TableCell>
                    <TableCell>{entry.actionLabel}</TableCell>
                    <TableCell className="max-w-[12rem] truncate">
                      {displayValue(entry.oldValue)}
                    </TableCell>
                    <TableCell className="max-w-[12rem] truncate">
                      {displayValue(entry.newValue)}
                    </TableCell>
                    <TableCell className="max-w-[14rem] truncate">
                      {displayValue(entry.remarks)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
