'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type {
  EstimateValidationResult,
  ValidationCheck,
  ValidationSeverity,
} from '@/types/validation';

interface ValidationPanelProps {
  validation: EstimateValidationResult;
}

function SeverityIcon({
  severity,
  className,
}: {
  severity: ValidationSeverity;
  className?: string;
}): React.JSX.Element {
  if (severity === 'passed') {
    return (
      <CheckCircle2
        className={cn('h-4 w-4 shrink-0 text-emerald-600', className)}
        aria-hidden
      />
    );
  }

  if (severity === 'warning') {
    return (
      <AlertTriangle
        className={cn('h-4 w-4 shrink-0 text-amber-500', className)}
        aria-hidden
      />
    );
  }

  return (
    <XCircle
      className={cn('h-4 w-4 shrink-0 text-destructive', className)}
      aria-hidden
    />
  );
}

function severityLabel(severity: ValidationSeverity): string {
  if (severity === 'passed') {
    return 'Passed';
  }
  if (severity === 'warning') {
    return 'Warning';
  }
  return 'Error';
}

function CheckRow({ check }: { check: ValidationCheck }): React.JSX.Element {
  const showGoTo =
    check.severity !== 'passed' && check.goToPath && check.goToLabel;

  return (
    <li className="flex flex-col gap-2 rounded-md border px-3 py-2 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 gap-2">
        <SeverityIcon severity={check.severity} className="mt-0.5" />
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{check.label}</p>
            <span
              className={cn(
                'text-xs font-medium',
                check.severity === 'passed' && 'text-emerald-600',
                check.severity === 'warning' && 'text-amber-600',
                check.severity === 'error' && 'text-destructive'
              )}
            >
              {severityLabel(check.severity)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{check.message}</p>
        </div>
      </div>
      {showGoTo ? (
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href={check.goToPath!}>{check.goToLabel}</Link>
        </Button>
      ) : null}
    </li>
  );
}

export function ValidationPanel({
  validation,
}: ValidationPanelProps): React.JSX.Element {
  const { scorePercent, categories, checks } = validation;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estimate Validation</CardTitle>
        <CardDescription>
          Validation runs before Excel export. Resolve critical errors to enable
          export.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-end justify-between gap-4">
            <p className="text-2xl font-semibold tabular-nums">
              {scorePercent}% Complete
            </p>
            <p className="text-sm text-muted-foreground">Validation Score</p>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={scorePercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Validation completion"
          >
            <div
              className={cn(
                'h-full rounded-full transition-all',
                scorePercent >= 100
                  ? 'bg-emerald-500'
                  : scorePercent >= 75
                    ? 'bg-amber-500'
                    : 'bg-destructive'
              )}
              style={{ width: `${scorePercent}%` }}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-2 rounded-md border px-3 py-2"
            >
              <SeverityIcon severity={category.severity} />
              <span className="text-sm font-medium">{category.label}</span>
            </div>
          ))}
        </div>

        <ul className="space-y-2">
          {checks.map((check) => (
            <CheckRow key={check.id} check={check} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
