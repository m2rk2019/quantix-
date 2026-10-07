'use client';

import { FileSpreadsheet, FileText, Printer } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROUTES } from '@/lib/constants/routes';
import {
  EXECUTIVE_REPORT_LABELS,
  type ExecutiveReportType,
} from '@/types/dashboard';

const REPORT_TYPES = Object.keys(EXECUTIVE_REPORT_LABELS) as ExecutiveReportType[];

const secondaryButtonClass =
  'h-10 rounded-xl border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:ring-[#E31E24]';

export function ExecutiveReportsToolbar(): React.JSX.Element {
  const searchParams = useSearchParams();
  const [reportType, setReportType] = useState<ExecutiveReportType>('executive_summary');

  const query = searchParams.toString();
  const exportUrl = `/api/dashboard/export?report=${reportType}${query ? `&${query}` : ''}`;
  const printUrl = `${ROUTES.dashboardPrint}${query ? `?${query}` : ''}`;

  return (
    <section
      className="dashboard-fade-in flex flex-col gap-4 rounded-2xl border border-border/60 bg-white p-5 opacity-0 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      aria-label="Executive reports"
    >
      <div>
        <p className="text-sm font-semibold text-foreground">Executive Reports</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          One-click portfolio summaries for leadership review
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={reportType}
          onValueChange={(value) => setReportType(value as ExecutiveReportType)}
        >
          <SelectTrigger className="h-10 w-[220px] rounded-xl border-border/80 bg-white shadow-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REPORT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {EXECUTIVE_REPORT_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button asChild variant="outline" className={secondaryButtonClass}>
          <a href={exportUrl}>
            <FileSpreadsheet className="h-4 w-4" aria-hidden />
            Excel
          </a>
        </Button>
        <Button asChild variant="outline" className={secondaryButtonClass}>
          <a href={printUrl} target="_blank" rel="noopener noreferrer">
            <Printer className="h-4 w-4" aria-hidden />
            PDF
          </a>
        </Button>
        <Button
          asChild
          className="h-10 rounded-xl bg-[#E31E24] px-4 text-white shadow-sm transition-all hover:bg-[#c91a1f] hover:shadow-md focus-visible:ring-[#E31E24]"
        >
          <a href={printUrl} target="_blank" rel="noopener noreferrer">
            <FileText className="h-4 w-4" aria-hidden />
            Executive Summary
          </a>
        </Button>
      </div>
    </section>
  );
}
