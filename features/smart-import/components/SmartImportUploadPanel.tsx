'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { FileSpreadsheet, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants/routes';
import { runSmartExcelImport } from '@/services/smart-import/run-smart-import';

export function SmartImportUploadPanel(): React.JSX.Element {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onFiles = useCallback((list: FileList | null) => {
    const next = list?.[0] ?? null;
    if (!next) return;
    if (!next.name.toLowerCase().endsWith('.xlsx')) {
      setError('Please upload an .xlsx workbook.');
      return;
    }
    setError(null);
    setFile(next);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">AI Smart Excel Import</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a Budgetary Cost Breakdown workbook. Quantix will recognize the
          structure, build WBS/BOQ, match resources, generate the estimate,
          prepare a tender package, and leave the project ready for estimator
          review.
        </p>
      </div>

      <div
        className={`rounded-xl border border-dashed p-10 text-center transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'border-border'
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          onFiles(event.dataTransfer.files);
        }}
      >
        <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium">Drag & drop your .xlsx workbook</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Official reference profile: MCC Budgetary Cost Breakdown
        </p>
        <label className="mt-4 inline-flex cursor-pointer">
          <input
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(event) => onFiles(event.target.files)}
          />
          <span className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Choose file
          </span>
        </label>
        {file ? (
          <p className="mt-4 inline-flex items-center gap-2 text-sm">
            <FileSpreadsheet className="h-4 w-4" />
            {file.name} ({Math.round(file.size / 1024)} KB)
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {progress ? (
        <p className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-800">
          {progress}
        </p>
      ) : null}

      <Button
        disabled={!file || isPending}
        onClick={() => {
          if (!file) return;
          const formData = new FormData();
          formData.set('file', file);
          setError(null);
          setProgress('Analyzing workbook and building project…');
          startTransition(async () => {
            const result = await runSmartExcelImport(formData);
            if (!result.success || !result.projectId) {
              setProgress(null);
              setError(result.error ?? 'Import failed');
              return;
            }
            const recon = result.reconciliation;
            setProgress(
              `Import complete — WBS ${result.wbsCount}, BOQ ${result.boqCount}, Resources ${result.resourceCount}, Linked ${result.linkedBoqCount ?? 0}. Reconciliation: ${
                recon?.overall_pass ? 'PASS' : 'REVIEW'
              }. Opening project…`
            );
            router.push(ROUTES.project(result.projectId));
          });
        }}
      >
        {isPending ? 'Importing…' : 'Start Smart Import'}
      </Button>
    </div>
  );
}
