'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatCurrency } from '@/lib/format-currency';
import type { BidSummaryData } from '@/types/estimate';
import type { ReportBranding } from '@/types/company-settings';
import type { CurrencyCode } from '@/types/project';

interface BidSummaryPanelProps {
  bid: BidSummaryData;
  currency: CurrencyCode;
  branding?: ReportBranding;
}

export function BidSummaryPanel({
  bid,
  currency,
  branding,
}: BidSummaryPanelProps): React.JSX.Element {
  const rows = [
    { label: 'Total Direct Cost', value: bid.total_direct_cost },
    { label: 'Indirect Cost (OCM)', value: bid.indirect_cost },
    { label: 'Markup (Profit)', value: bid.markup },
    { label: 'VAT', value: bid.vat },
    { label: 'Grand Total', value: bid.grand_total, highlight: true },
  ];

  return (
    <Card id="bid-summary-panel">
      <CardHeader>
        <CardTitle>Bid Summary</CardTitle>
        <CardDescription>Executive estimate summary for client submission</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {branding?.reportHeader && (
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {branding.reportHeader}
          </p>
        )}
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Project</dt>
            <dd className="font-medium">{bid.project_name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Client</dt>
            <dd className="font-medium">{bid.client_name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Estimate Date</dt>
            <dd>{bid.estimate_date}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Prepared By</dt>
            <dd>{bid.prepared_by}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Location</dt>
            <dd>{bid.location}</dd>
          </div>
        </dl>

        <div className="space-y-2 border-t pt-4">
          {rows.map((row) => (
            <div
              key={row.label}
              className={`flex items-center justify-between gap-4 ${
                row.highlight ? 'border-t pt-3 text-lg font-bold' : ''
              }`}
            >
              <span className={row.highlight ? '' : 'text-muted-foreground'}>{row.label}</span>
              <span className="tabular-nums">
                {formatCurrency(row.value, currency)}
              </span>
            </div>
          ))}
        </div>

        {bid.cost_per_square_meter !== null && (
          <p className="text-sm text-muted-foreground">
            Cost per m²: {formatCurrency(bid.cost_per_square_meter, currency)}
          </p>
        )}
        {branding?.signatureBlock && (
          <pre className="whitespace-pre-wrap border-t pt-4 text-xs text-muted-foreground">
            {branding.signatureBlock}
          </pre>
        )}
        {branding?.reportFooter && (
          <p className="text-xs text-muted-foreground">{branding.reportFooter}</p>
        )}
      </CardContent>
    </Card>
  );
}
