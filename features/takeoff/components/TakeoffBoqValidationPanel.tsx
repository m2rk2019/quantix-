'use client';

import { AlertTriangle } from 'lucide-react';

import type { TakeoffBoqValidationIssue } from '@/lib/takeoff/boq-sync';

interface TakeoffBoqValidationPanelProps {
  issues: TakeoffBoqValidationIssue[];
  onSelectMeasurement?: (id: string) => void;
}

export function TakeoffBoqValidationPanel({
  issues,
  onSelectMeasurement,
}: TakeoffBoqValidationPanelProps): React.JSX.Element | null {
  if (issues.length === 0) return null;

  const shown = issues.slice(0, 8);
  const more = issues.length - shown.length;

  return (
    <div className="border-b bg-amber-50/80 px-3 py-2 dark:bg-amber-950/30">
      <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
        <AlertTriangle className="h-3 w-3" />
        BOQ Validation ({issues.length})
      </p>
      <ul className="max-h-24 space-y-0.5 overflow-y-auto text-[11px] text-amber-950 dark:text-amber-100">
        {shown.map((issue, i) => (
          <li key={`${issue.code}-${i}`}>
            {issue.measurementId && onSelectMeasurement ? (
              <button
                type="button"
                className="text-left underline-offset-2 hover:underline"
                onClick={() => onSelectMeasurement(issue.measurementId!)}
              >
                [{issue.severity}] {issue.message}
              </button>
            ) : (
              <span>
                [{issue.severity}] {issue.message}
              </span>
            )}
          </li>
        ))}
        {more > 0 ? (
          <li className="text-muted-foreground">…and {more} more</li>
        ) : null}
      </ul>
    </div>
  );
}
