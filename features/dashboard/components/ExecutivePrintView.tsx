'use client';

import { formatCurrency } from '@/lib/format-currency';
import {
  ReportBrandingFooter,
  ReportBrandingHeader,
} from '@/features/shared/components/ReportBrandingBlock';
import type { ExecutiveDashboardData } from '@/types/dashboard';
import { EXECUTIVE_STATUS_LABELS } from '@/types/dashboard';
import type { ReportBranding } from '@/types/company-settings';

interface ExecutivePrintViewProps {
  data: ExecutiveDashboardData;
  branding: ReportBranding;
}

export function ExecutivePrintView({
  data,
  branding,
}: ExecutivePrintViewProps): React.JSX.Element {
  const { kpis, cost_breakdown, discipline_breakdown, insights, display_currency } = data;

  return (
    <div className="space-y-8 bg-white p-8 text-black print:p-0">
      <ReportBrandingHeader branding={branding} subtitle="Executive Dashboard">
        <h1 className="mt-1 text-2xl font-bold">Portfolio Executive Summary</h1>
        <p className="text-sm text-gray-600">
          Generated {new Date(data.generated_at).toLocaleString()}
        </p>
        {data.mixed_currency_warning && (
          <p className="mt-2 text-xs text-amber-700">
            Mixed currencies in portfolio — amounts summed without conversion.
          </p>
        )}
      </ReportBrandingHeader>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Key Performance Indicators</h2>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b">
              <td className="py-2">Total Projects</td>
              <td className="py-2 text-right">{kpis.total_projects}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2">Active Projects</td>
              <td className="py-2 text-right">{kpis.active_projects}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2">Total Estimated Value</td>
              <td className="py-2 text-right font-semibold">
                {formatCurrency(kpis.total_estimated_value, display_currency)}
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2">Average Markup</td>
              <td className="py-2 text-right">{kpis.average_markup_percent.toFixed(1)}%</td>
            </tr>
            <tr className="border-b">
              <td className="py-2">AI Confidence</td>
              <td className="py-2 text-right">
                {(data.ai_confidence_score * 100).toFixed(0)}%
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Cost Breakdown</h2>
        <table className="w-full text-sm">
          <tbody>
            {[
              ['Material', cost_breakdown.material],
              ['Labor', cost_breakdown.labor],
              ['Equipment', cost_breakdown.equipment],
              ['Subcontract', cost_breakdown.subcontract],
              ['OCM', cost_breakdown.ocm],
              ['Contingency', cost_breakdown.contingency],
              ['Profit', cost_breakdown.profit],
              ['VAT', cost_breakdown.vat],
              ['Grand Total', cost_breakdown.grand_total],
            ].map(([label, amount]) => (
              <tr key={String(label)} className="border-b">
                <td className="py-2">{label}</td>
                <td className="py-2 text-right tabular-nums">
                  {formatCurrency(Number(amount), display_currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Project Status</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-1">Status</th>
              <th className="py-1 text-right">Count</th>
            </tr>
          </thead>
          <tbody>
            {data.status_counts.map((item) => (
              <tr key={item.status} className="border-b">
                <td className="py-2">{EXECUTIVE_STATUS_LABELS[item.status]}</td>
                <td className="py-2 text-right">{item.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {discipline_breakdown.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Discipline Summary</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-1">Discipline</th>
                <th className="py-1 text-right">Amount</th>
                <th className="py-1 text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {discipline_breakdown.map((item) => (
                <tr key={item.name} className="border-b">
                  <td className="py-2">{item.name}</td>
                  <td className="py-2 text-right">
                    {formatCurrency(item.amount, display_currency)}
                  </td>
                  <td className="py-2 text-right">{item.percent.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">AI Insights & Risk</h2>
        <ul className="space-y-2 text-sm">
          {insights.map((insight) => (
            <li key={insight.id} className="border-b pb-2">
              <strong>{insight.title}</strong> ({insight.severity})
              <p className="text-gray-600">{insight.message}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Projects in View</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-1">Code</th>
              <th className="py-1">Project</th>
              <th className="py-1 text-right">Grand Total</th>
            </tr>
          </thead>
          <tbody>
            {data.projects.map((project) => (
              <tr key={project.id} className="border-b">
                <td className="py-2 font-mono">{project.project_code}</td>
                <td className="py-2">{project.project_name}</td>
                <td className="py-2 text-right">
                  {formatCurrency(project.grand_total, project.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <ReportBrandingFooter branding={branding} />
    </div>
  );
}
