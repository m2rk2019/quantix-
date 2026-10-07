'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { importBenchmarkProjectAction } from '@/services/benchmark/benchmark-actions';
import { ROUTES } from '@/lib/constants/routes';

export function BenchmarkImportPanel(): React.JSX.Element {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  return (
    <div className="max-w-xl space-y-4 rounded-lg border bg-card p-6">
      <div>
        <h3 className="text-lg font-semibold">Demo Data Import</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Import WBS, BOQ, estimate summary, and benchmark actuals from Excel (.xlsx) or CSV.
          Excel sheets: Metadata, WBS, BOQ, Summary. CSV uses section headers: --- metadata ---, --- wbs ---, --- boq ---.
        </p>
      </div>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          setResult(null);
          const formData = new FormData(event.currentTarget);
          startTransition(async () => {
            const response = await importBenchmarkProjectAction(formData);
            if (!response.ok) {
              setError(response.error ?? 'Import failed.');
              return;
            }
            setResult(
              `Imported ${response.boqCount ?? 0} BOQ items, ${response.wbsCount ?? 0} WBS nodes, ${response.actualsCount ?? 0} actuals.`
            );
          });
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="import-file">Project file</Label>
          <Input id="import-file" name="file" type="file" accept=".xlsx,.csv" required />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Importing…' : 'Import Project'}
        </Button>
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {result && (
        <p className="text-sm text-green-700">
          {result}{' '}
          <Link href={ROUTES.adminBenchmarks} className="underline">
            Refresh validation
          </Link>
        </p>
      )}
    </div>
  );
}
