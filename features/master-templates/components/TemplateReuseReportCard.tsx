'use client';

import type { TemplateReuseReport } from '@/lib/master-templates/compare-boq-to-template';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const STATUS_LABEL: Record<string, string> = {
  exact_match: 'Exact Match',
  quantity_changed: 'Quantity Changed',
  unit_rate_changed: 'Unit Rate Changed',
  new_item: 'New Item',
  removed_item: 'Removed Item',
  uncertain_match: 'Uncertain Match',
};

interface TemplateReuseReportCardProps {
  report: TemplateReuseReport;
}

export function TemplateReuseReportCard({
  report,
}: TemplateReuseReportCardProps): React.JSX.Element {
  const reviewLines = report.lines.filter((line) => line.needs_estimator_review);

  return (
    <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
      <div>
        <h4 className="font-medium">Template Reuse Report</h4>
        <p className="text-xs text-muted-foreground">
          Generated {new Date(report.generated_at).toLocaleString()} · Template:{' '}
          {report.template_name} · Reuse threshold{' '}
          {Math.round((report.match_reuse_threshold ?? 0.8) * 100)}%
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Total Imported Items" value={report.total_imported_items} />
        <Stat label="Exact Matches" value={report.exact_matches} />
        <Stat label="Quantity Changes" value={report.quantity_changes} />
        <Stat label="Unit Rate Changed" value={report.unit_rate_changes} />
        <Stat label="New Items" value={report.new_items} />
        <Stat label="Removed Items" value={report.removed_items} />
        <Stat
          label="Uncertain Matches"
          value={report.uncertain_matches ?? 0}
        />
      </div>

      <p className="text-sm">
        <span className="font-medium">
          {report.percentage_boq_automatically_reused.toFixed(1)}%
        </span>{' '}
        of BOQ automatically reused company rates (high-confidence matches only)
      </p>

      {reviewLines.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Needs Estimator Review ({reviewLines.length})
          </p>
          <div className="max-h-64 overflow-auto rounded-md border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviewLines.map((line) => (
                  <TableRow key={`${line.match_key}-${line.source_row ?? ''}`}>
                    <TableCell className="whitespace-nowrap text-xs">
                      {line.item_code || '—'}
                    </TableCell>
                    <TableCell className="text-sm">{line.description}</TableCell>
                    <TableCell className="text-xs text-amber-700">
                      {STATUS_LABEL[line.status] ?? line.status}
                    </TableCell>
                    <TableCell className="text-xs tabular-nums">
                      {Math.round((line.match_confidence ?? 0) * 100)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <p className="text-sm text-emerald-700">
          All imported items matched with high confidence — no estimator review
          required.
        </p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number;
}): React.JSX.Element {
  return (
    <div className="rounded-md border bg-background px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
