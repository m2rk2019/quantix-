'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { FileSpreadsheet, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { runTemplateReuseImport } from '@/services/master-templates/run-template-reuse-import';
import type { TemplateReuseReport } from '@/lib/master-templates/compare-boq-to-template';

import { TemplateReuseReportCard } from './TemplateReuseReportCard';

interface TemplateReuseImportPanelProps {
  projectId: string;
  templateName: string;
  canImport: boolean;
  initialReport: TemplateReuseReport | null;
}

function isReuseReport(value: unknown): value is TemplateReuseReport {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.total_imported_items === 'number' &&
    typeof row.percentage_boq_automatically_reused === 'number'
  );
}

export function TemplateReuseImportPanel({
  projectId,
  templateName,
  canImport,
  initialReport,
}: TemplateReuseImportPanelProps): React.JSX.Element {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<TemplateReuseReport | null>(
    initialReport
  );
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
    <div className="space-y-4 rounded-lg border p-4">
      <div>
        <h3 className="font-medium">Import New Excel BCB</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Compare against master template <strong>{templateName}</strong> using
          deterministic matching (item code → description → unit → WBS →
          similarity). High-confidence matches reuse company rates; uncertain or
          new items are flagged for estimator review.
        </p>
      </div>

      {canImport ? (
        <>
          <div
            className={`rounded-lg border border-dashed p-6 text-center transition-colors ${
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
            <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">Drop BCB workbook (.xlsx)</p>
            <label className="mt-3 inline-flex cursor-pointer">
              <input
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={(event) => onFiles(event.target.files)}
              />
              <span className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm">
                Choose file
              </span>
            </label>
            {file ? (
              <p className="mt-3 inline-flex items-center gap-2 text-sm">
                <FileSpreadsheet className="h-4 w-4" />
                {file.name}
              </p>
            ) : null}
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button
            type="button"
            disabled={!file || isPending}
            onClick={() => {
              if (!file) return;
              const formData = new FormData();
              formData.set('file', file);
              setError(null);
              startTransition(async () => {
                const result = await runTemplateReuseImport(projectId, formData);
                if (!result.success) {
                  setError(result.error ?? 'Template reuse import failed');
                  return;
                }
                if (result.report) setReport(result.report);
                setFile(null);
                router.refresh();
              });
            }}
          >
            {isPending ? 'Comparing & applying…' : 'Import & compare to template'}
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          You do not have permission to import against this template.
        </p>
      )}

      {report && isReuseReport(report) ? (
        <TemplateReuseReportCard report={report} />
      ) : null}
    </div>
  );
}
