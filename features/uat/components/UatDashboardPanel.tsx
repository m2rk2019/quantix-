'use client';

import { Badge } from '@/components/ui/badge';
import type { UatAutomatedCheck, UatChecklistSummary } from '@/types/uat';
import { UAT_MODULE_LABELS } from '@/types/uat';

interface UatDashboardPanelProps {
  checklist: UatChecklistSummary;
  automatedChecks: UatAutomatedCheck[];
  formulaAccuracy: number | null;
  performancePassed: boolean;
}

export function UatDashboardPanel({
  checklist,
  automatedChecks,
  formulaAccuracy,
  performancePassed,
}: UatDashboardPanelProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Manual Scenarios</p>
          <p className="text-2xl font-semibold tabular-nums">{checklist.total_scenarios}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Automated Scripts</p>
          <p className="text-2xl font-semibold tabular-nums">{automatedChecks.length}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Formula Verification</p>
          <p className="text-2xl font-semibold tabular-nums">
            {formulaAccuracy !== null ? `${formulaAccuracy.toFixed(1)}%` : '—'}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Performance</p>
          <Badge
            className="mt-1"
            variant={performancePassed ? 'secondary' : 'destructive'}
          >
            {performancePassed ? 'Pass' : 'Fail'}
          </Badge>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Coverage by Module</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {checklist.modules.map((mod) => (
            <div
              key={mod.module}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <span>{mod.label}</span>
              <Badge variant="outline">{mod.scenario_count}</Badge>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Automated Verify Scripts</h3>
        <ul className="space-y-2 text-sm">
          {automatedChecks.map((check) => (
            <li
              key={check.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
            >
              <div>
                <span className="font-medium">{check.label}</span>
                <span className="ml-2 text-muted-foreground">
                  ({UAT_MODULE_LABELS[check.module]})
                </span>
              </div>
              <code className="text-xs">npm run {check.npmScript}</code>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
