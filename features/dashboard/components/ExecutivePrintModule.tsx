'use client';

import { useEffect } from 'react';

import { ExecutivePrintView } from '@/features/dashboard/components/ExecutivePrintView';
import type { ExecutiveDashboardData } from '@/types/dashboard';
import type { ReportBranding } from '@/types/company-settings';

interface ExecutivePrintModuleProps {
  data: ExecutiveDashboardData;
  branding: ReportBranding;
  autoPrint?: boolean;
}

export function ExecutivePrintModule({
  data,
  branding,
  autoPrint = true,
}: ExecutivePrintModuleProps): React.JSX.Element {
  useEffect(() => {
    if (!autoPrint) {
      return;
    }
    const timer = window.setTimeout(() => {
      window.print();
    }, 400);
    return () => window.clearTimeout(timer);
  }, [autoPrint]);

  return <ExecutivePrintView data={data} branding={branding} />;
}
