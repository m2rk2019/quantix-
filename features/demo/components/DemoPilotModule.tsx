'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants/routes';
import {
  MEGAWIDE_PROJECT_CODE,
  MEGAWIDE_PROJECT_ID,
  MEGAWIDE_PROJECT_NAME,
} from '@/lib/demo/megawide-constants';
import {
  loadDemoProjectAction,
  resetDemoDatabaseAction,
  type DemoActionResult,
} from '@/services/demo/megawide-demo-actions';

export function DemoPilotModule(): React.JSX.Element {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<DemoActionResult | null>(null);

  function runAction(action: () => Promise<DemoActionResult>) {
    startTransition(async () => {
      const response = await action();
      setResult(response);
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold">{MEGAWIDE_PROJECT_NAME}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Complete Philippine construction pilot dataset — 600 BOQ lines across 15
          disciplines, company resource library, rate analysis, estimate summary, bid
          summary, executive dashboard KPIs, and historical benchmark actuals. Grand total
          target: PHP 300M–600M.
        </p>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Project code</dt>
            <dd className="font-mono">{MEGAWIDE_PROJECT_CODE}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Project ID</dt>
            <dd className="font-mono text-xs">{MEGAWIDE_PROJECT_ID}</dd>
          </div>
        </dl>
      </section>

      <section className="flex flex-wrap gap-3">
        <Button
          type="button"
          disabled={pending}
          onClick={() => runAction(loadDemoProjectAction)}
        >
          Load Demo Project
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => runAction(resetDemoDatabaseAction)}
        >
          Reset Demo Database
        </Button>
        <Button type="button" variant="secondary" asChild>
          <Link href={ROUTES.project(MEGAWIDE_PROJECT_ID)}>Open Demo Project</Link>
        </Button>
      </section>

      {pending && (
        <p className="text-sm text-muted-foreground">Running demo script…</p>
      )}

      {result && (
        <pre
          className={`overflow-x-auto rounded-md border p-4 text-xs whitespace-pre-wrap ${
            result.ok
              ? 'border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100'
              : 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100'
          }`}
        >
          {result.message}
        </pre>
      )}

      <section className="rounded-lg border p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">CLI equivalents</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            <code className="text-xs">npm run load:demo</code> — generate SQL and apply
            to Supabase
          </li>
          <li>
            <code className="text-xs">npm run reset:demo</code> — remove pilot seed data
          </li>
          <li>
            <code className="text-xs">npm run verify:megawide-office</code> — verify
            totals and consistency
          </li>
        </ul>
      </section>
    </div>
  );
}
