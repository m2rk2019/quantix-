'use client';

import { Badge } from '@/components/ui/badge';
import type { UatPerformanceSuiteResult } from '@/types/uat';

interface UatPerformancePanelProps {
  data: UatPerformanceSuiteResult;
}

export function UatPerformancePanel({
  data,
}: UatPerformancePanelProps): React.JSX.Element {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Badge variant={data.all_passed ? 'secondary' : 'destructive'}>
          {data.all_passed ? 'All Passed' : 'Failures Detected'}
        </Badge>
        <span className="text-sm text-muted-foreground">
          Run at {new Date(data.run_at).toLocaleString()}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/95">
            <tr className="border-b text-left">
              <th className="px-3 py-2">Metric</th>
              <th className="px-3 py-2 text-right">Duration (ms)</th>
              <th className="px-3 py-2 text-right">Threshold (ms)</th>
              <th className="px-3 py-2">Result</th>
              <th className="px-3 py-2">Detail</th>
            </tr>
          </thead>
          <tbody>
            {data.results.map((result) => (
              <tr key={result.id} className="border-b">
                <td className="px-3 py-2 font-medium">{result.label}</td>
                <td className="px-3 py-2 text-right tabular-nums">{result.duration_ms}</td>
                <td className="px-3 py-2 text-right tabular-nums">{result.threshold_ms}</td>
                <td className="px-3 py-2">
                  <Badge variant={result.passed ? 'secondary' : 'destructive'}>
                    {result.passed ? 'Pass' : 'Fail'}
                  </Badge>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{result.detail ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-muted-foreground">
        In-memory benchmarks using 1000-item synthetic BOQ. Thresholds align with{' '}
        <code className="text-xs">docs/PERFORMANCE_GUIDE.md</code> and Sprint 8 verify suite.
      </p>
    </div>
  );
}
