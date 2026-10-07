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
import { UAT_REPORT_LABELS, type UatReportType } from '@/types/uat';

const REPORT_TYPES = Object.keys(UAT_REPORT_LABELS) as UatReportType[];

interface UatReportsToolbarProps {
  projectId?: string;
}

export function UatReportsToolbar({
  projectId,
}: UatReportsToolbarProps): React.JSX.Element {
  const [reportType, setReportType] = useState<UatReportType>('executive_uat');

  const params = new URLSearchParams({ report: reportType });
  if (projectId) {
    params.set('projectId', projectId);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-4">
      <Select
        value={reportType}
        onValueChange={(value) => setReportType(value as UatReportType)}
      >
        <SelectTrigger className="w-[260px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {REPORT_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {UAT_REPORT_LABELS[type]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button asChild variant="outline" size="sm">
        <a href={`/api/uat/export?${params.toString()}`}>
          <FileSpreadsheet className="mr-1.5 h-4 w-4" />
          Test Report
        </a>
      </Button>
    </div>
  );
}
