'use client';

import { useState, useTransition } from 'react';
import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  exportTakeoff,
  type TakeoffExportFormat,
} from '@/services/takeoff/export';

interface TakeoffExportMenuProps {
  projectId: string;
}

function downloadBase64(filename: string, mime: string, base64: string) {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function TakeoffExportMenu({
  projectId,
}: TakeoffExportMenuProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = (format: TakeoffExportFormat) => {
    setError(null);
    startTransition(async () => {
      const result = await exportTakeoff({ projectId, format });
      if (!result.success || !result.base64 || !result.filename || !result.mime) {
        setError(result.error ?? 'Export failed');
        return;
      }
      downloadBase64(result.filename, result.mime, result.base64);
      setOpen(false);
    });
  };

  return (
    <div className="relative">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-8 gap-1 text-xs"
        onClick={() => setOpen((o) => !o)}
        disabled={isPending}
      >
        <Download className="h-3.5 w-3.5" />
        Export
      </Button>
      {open ? (
        <div className="absolute right-0 z-20 mt-1 w-44 rounded-md border bg-background p-1 shadow-md">
          {(
            [
              ['csv', 'CSV'],
              ['xlsx', 'Excel (.xlsx)'],
              ['pdf', 'PDF'],
              ['report', 'Takeoff Report'],
            ] as const
          ).map(([fmt, label]) => (
            <button
              key={fmt}
              type="button"
              className="block w-full rounded px-2 py-1.5 text-left text-xs hover:bg-muted"
              onClick={() => run(fmt)}
            >
              {label}
            </button>
          ))}
          {error ? (
            <p className="px-2 py-1 text-[10px] text-destructive">{error}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
