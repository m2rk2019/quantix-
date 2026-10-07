'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { Download, FileSpreadsheet, FileText, Package } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTime } from '@/lib/format';
import { generateTenderSubmissionAction } from '@/services/tender/tender-actions';
import type { TenderBrandingConfig, TenderSubmissionListItem } from '@/types/tender';
import {
  DEFAULT_ENABLED_TENDER_SECTIONS,
  TENDER_SECTION_LABELS,
  TENDER_SECTIONS,
  type TenderSectionId,
} from '@/types/tender';

interface TenderSubmissionModuleProps {
  projectId: string;
  branding: TenderBrandingConfig;
  assumptions: string;
  exclusions: string;
  commercialNotes: string;
  history: TenderSubmissionListItem[];
  canGenerate: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function TenderSubmissionModule({
  projectId,
  branding,
  assumptions,
  exclusions,
  commercialNotes,
  history,
  canGenerate,
}: TenderSubmissionModuleProps): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<Record<TenderSectionId, boolean>>(
    () =>
      Object.fromEntries(
        TENDER_SECTIONS.map((id) => [
          id,
          DEFAULT_ENABLED_TENDER_SECTIONS.includes(id),
        ])
      ) as Record<TenderSectionId, boolean>
  );

  const enabledCount = useMemo(
    () => TENDER_SECTIONS.filter((id) => enabled[id]).length,
    [enabled]
  );

  const toggleAll = (value: boolean) => {
    setEnabled(
      Object.fromEntries(TENDER_SECTIONS.map((id) => [id, value])) as Record<
        TenderSectionId,
        boolean
      >
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Tender Submission Package</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate a branded tender package from the approved estimate. Enable
          sections, set sign-off names, then export PDF, Excel, or a ZIP package.
        </p>
      </div>

      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canGenerate) return;
          const formData = new FormData(event.currentTarget);
          for (const section of TENDER_SECTIONS) {
            if (enabled[section]) {
              formData.set(`section_${section}`, 'on');
            }
          }
          formData.set('export_pdf', 'on');
          formData.set('export_excel', 'on');
          formData.set('export_zip', 'on');

          setError(null);
          setSuccess(null);
          startTransition(async () => {
            const result = await generateTenderSubmissionAction(
              projectId,
              formData
            );
            if (!result.success) {
              setError(result.error ?? 'Generation failed');
              return;
            }
            setSuccess(
              `Generated tender package v${result.version} with ${result.exports?.length ?? 0} export file(s).`
            );
            router.refresh();
          });
        }}
      >
        <section className="rounded-lg border p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-medium">Document sections ({enabledCount})</h3>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => toggleAll(true)}
              >
                Enable all
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => toggleAll(false)}
              >
                Disable all
              </Button>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {TENDER_SECTIONS.map((section) => (
              <label
                key={section}
                className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={enabled[section]}
                  onChange={(event) =>
                    setEnabled((prev) => ({
                      ...prev,
                      [section]: event.target.checked,
                    }))
                  }
                />
                <span>{TENDER_SECTION_LABELS[section]}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
          <div>
            <h3 className="mb-3 font-medium">Company branding</h3>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Company</dt>
                <dd className="font-medium">{branding.company_name}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Address</dt>
                <dd className="text-right">{branding.address ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Contact</dt>
                <dd className="text-right">
                  {[branding.phone, branding.email].filter(Boolean).join(' · ') ||
                    '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Logo</dt>
                <dd className="truncate text-right text-xs">
                  {branding.logo_url ?? '—'}
                </dd>
              </div>
            </dl>
          </div>
          <div className="space-y-3">
            <h3 className="font-medium">Sign-off</h3>
            <div className="space-y-1.5">
              <Label htmlFor="prepared_by">Prepared by</Label>
              <Input
                id="prepared_by"
                name="prepared_by"
                defaultValue={branding.prepared_by}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="checked_by">Checked by</Label>
              <Input
                id="checked_by"
                name="checked_by"
                defaultValue={branding.checked_by}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="approved_by">Approved by</Label>
              <Input
                id="approved_by"
                name="approved_by"
                defaultValue={branding.approved_by}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-4 rounded-lg border p-4">
          <div className="space-y-1.5">
            <Label htmlFor="assumptions">Assumptions</Label>
            <Textarea
              id="assumptions"
              name="assumptions"
              rows={3}
              defaultValue={assumptions}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="exclusions">Exclusions</Label>
            <Textarea
              id="exclusions"
              name="exclusions"
              rows={3}
              defaultValue={exclusions}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="commercial_notes">Commercial notes</Label>
            <Textarea
              id="commercial_notes"
              name="commercial_notes"
              rows={3}
              defaultValue={commercialNotes}
            />
          </div>
        </section>

        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-800">
            {success}
          </p>
        ) : null}

        <Button type="submit" disabled={!canGenerate || isPending || enabledCount === 0}>
          {isPending ? 'Generating package…' : 'Generate Tender Package (PDF + Excel + ZIP)'}
        </Button>
        {!canGenerate ? (
          <p className="text-sm text-muted-foreground">
            Viewers cannot generate tender packages.
          </p>
        ) : null}
      </form>

      <section>
        <h3 className="mb-3 font-medium">Version &amp; audit history</h3>
        {history.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No tender packages generated yet.
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Generated by</TableHead>
                  <TableHead>Generated date</TableHead>
                  <TableHead>Export type</TableHead>
                  <TableHead>File size</TableHead>
                  <TableHead>Download</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.flatMap((item) =>
                  item.exports.length > 0
                    ? item.exports.map((file) => (
                        <TableRow key={file.id}>
                          <TableCell className="font-mono">v{item.version}</TableCell>
                          <TableCell>{file.generated_by_name}</TableCell>
                          <TableCell>{formatDateTime(file.generated_at)}</TableCell>
                          <TableCell className="uppercase">{file.export_type}</TableCell>
                          <TableCell>{formatBytes(file.file_size_bytes)}</TableCell>
                          <TableCell>
                            <a
                              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                              href={`/api/projects/${projectId}/tender/${item.id}/export/${file.export_type}`}
                            >
                              {file.export_type === 'pdf' ? (
                                <FileText className="h-3.5 w-3.5" />
                              ) : file.export_type === 'excel' ? (
                                <FileSpreadsheet className="h-3.5 w-3.5" />
                              ) : (
                                <Package className="h-3.5 w-3.5" />
                              )}
                              <Download className="h-3.5 w-3.5" />
                              {file.filename}
                            </a>
                          </TableCell>
                        </TableRow>
                      ))
                    : [
                        <TableRow key={item.id}>
                          <TableCell className="font-mono">v{item.version}</TableCell>
                          <TableCell>{item.generated_by_name}</TableCell>
                          <TableCell>{formatDateTime(item.generated_at)}</TableCell>
                          <TableCell>—</TableCell>
                          <TableCell>—</TableCell>
                          <TableCell>—</TableCell>
                        </TableRow>,
                      ]
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
