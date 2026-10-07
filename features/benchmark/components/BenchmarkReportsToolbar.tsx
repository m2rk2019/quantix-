'use client';

import { useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BENCHMARK_REPORT_LABELS,
  type BenchmarkReportType,
} from '@/types/benchmark';

const REPORT_TYPES = Object.keys(BENCHMARK_REPORT_LABELS) as BenchmarkReportType[];

interface BenchmarkReportsToolbarProps {
  projectId?: string;
}

export function BenchmarkReportsToolbar({
  projectId,
}: BenchmarkReportsToolbarProps): React.JSX.Element {
  const [reportType, setReportType] = useState<BenchmarkReportType>('executive_accuracy');

  const params = new URLSearchParams({ report: reportType });
  if (projectId) {
    params.set('projectId', projectId);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-4">
      <Select
        value={reportType}
        onValueChange={(value) => setReportType(value as BenchmarkReportType)}
      >
        <SelectTrigger className="w-[240px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {REPORT_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {BENCHMARK_REPORT_LABELS[type]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button asChild variant="outline" size="sm">
        <a href={`/api/benchmark/export?${params.toString()}`}>
          <FileSpreadsheet className="mr-1.5 h-4 w-4" />
          Excel Report
        </a>
      </Button>
    </div>
  );
}
