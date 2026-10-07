'use client';

import { useEffect } from 'react';

import { EstimatePrintView } from '@/features/estimate/components/EstimatePrintView';
import type { ReportBranding } from '@/types/company-settings';
import type { EstimateSummaryData } from '@/types/estimate';

interface EstimatePrintModuleProps {
  data: EstimateSummaryData;
  branding: ReportBranding;
  autoPrint?: boolean;
}

export function EstimatePrintModule({
  data,
  branding,
  autoPrint = true,
}: EstimatePrintModuleProps): React.JSX.Element {
  useEffect(() => {
    if (!autoPrint) {
      return;
    }

    const timer = window.setTimeout(() => {
      window.print();
    }, 400);

    return () => window.clearTimeout(timer);
  }, [autoPrint]);

  return <EstimatePrintView data={data} branding={branding} />;
}
