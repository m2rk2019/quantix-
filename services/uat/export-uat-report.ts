import ExcelJS from 'exceljs';

import { UAT_AUTOMATED_CHECKS, UAT_SCENARIOS, getUatChecklistSummary } from '@/lib/uat/check-registry';
import { runPerformanceBenchmarks } from '@/lib/uat/performance-benchmarks';
import { getFormulaVerification } from '@/services/uat/get-formula-verification';
import {
  UAT_MODULE_LABELS,
  UAT_REPORT_LABELS,
  type UatReportType,
} from '@/types/uat';

export async function exportUatReportExcel(
  reportType: UatReportType,
  projectId?: string
): Promise<{ ok: true; buffer: Buffer; filename: string } | { ok: false; message: string }> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Quantix UAT';
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  switch (reportType) {
    case 'full_checklist': {
      const sheet = workbook.addWorksheet('UAT Checklist');
      sheet.addRow(['ID', 'Module', 'Scenario', 'Steps', 'Expected', 'Automated Script']);
      for (const scenario of UAT_SCENARIOS) {
        sheet.addRow([
          scenario.id,
          UAT_MODULE_LABELS[scenario.module],
          scenario.title,
          scenario.steps,
          scenario.expected,
          scenario.verifyScript ?? '',
        ]);
      }
      sheet.addRow([]);
      const summary = getUatChecklistSummary();
      sheet.addRow(['Total Scenarios', summary.total_scenarios]);
      for (const mod of summary.modules) {
        sheet.addRow([mod.label, mod.scenario_count]);
      }
      break;
    }
    case 'formula_verification': {
      if (!projectId) {
        return { ok: false, message: 'projectId required for formula verification report' };
      }
      const data = await getFormulaVerification(projectId);
      if (!data) {
        return { ok: false, message: 'Project not found or has no BOQ items' };
      }
      const sheet = workbook.addWorksheet('Formula Verification');
      sheet.addRow(['Project', data.project_code, data.project_name]);
      sheet.addRow(['Accuracy %', data.accuracy_percent]);
      sheet.addRow(['Passed', data.passed_count]);
      sheet.addRow(['Failed', data.failed_count]);
      sheet.addRow([]);
      sheet.addRow([
        'Item',
        'Manual Rate',
        'System Rate',
        'Rate Var %',
        'Manual Amount',
        'System Amount',
        'Amount Var %',
        'Pass/Fail',
      ]);
      for (const row of data.rows) {
        sheet.addRow([
          row.item_code,
          row.manual_total_rate,
          row.system_total_rate,
          row.rate_variance,
          row.manual_total_amount,
          row.system_total_amount,
          row.amount_variance,
          row.passed ? 'PASS' : 'FAIL',
        ]);
      }
      break;
    }
    case 'performance': {
      const perf = runPerformanceBenchmarks();
      const sheet = workbook.addWorksheet('Performance');
      sheet.addRow(['Metric', 'Duration (ms)', 'Threshold (ms)', 'Pass/Fail', 'Detail']);
      for (const result of perf.results) {
        sheet.addRow([
          result.label,
          result.duration_ms,
          result.threshold_ms,
          result.passed ? 'PASS' : 'FAIL',
          result.detail ?? '',
        ]);
      }
      sheet.addRow([]);
      sheet.addRow(['All Passed', perf.all_passed ? 'Yes' : 'No']);
      sheet.addRow(['Run At', perf.run_at]);
      break;
    }
    case 'automated_summary': {
      const sheet = workbook.addWorksheet('Automated Checks');
      sheet.addRow(['ID', 'Label', 'npm Script', 'Module', 'Description']);
      for (const check of UAT_AUTOMATED_CHECKS) {
        sheet.addRow([
          check.id,
          check.label,
          check.npmScript,
          UAT_MODULE_LABELS[check.module],
          check.description,
        ]);
      }
      break;
    }
    case 'executive_uat': {
      const summary = getUatChecklistSummary();
      const perf = runPerformanceBenchmarks();
      const sheet = workbook.addWorksheet('Executive UAT');
      sheet.addRow(['Quantix V1 — UAT Executive Summary']);
      sheet.addRow(['Generated', new Date().toISOString()]);
      sheet.addRow([]);
      sheet.addRow(['Total Manual Scenarios', summary.total_scenarios]);
      sheet.addRow(['Automated Check Scripts', UAT_AUTOMATED_CHECKS.length]);
      sheet.addRow(['Performance All Passed', perf.all_passed ? 'Yes' : 'No']);
      if (projectId) {
        const formula = await getFormulaVerification(projectId);
        if (formula) {
          sheet.addRow(['Formula Accuracy %', formula.accuracy_percent]);
          sheet.addRow(['Formula Pass/Fail', formula.failed_count === 0 ? 'PASS' : 'FAIL']);
        }
      }
      sheet.addRow([]);
      sheet.addRow(['Module', 'Scenario Count']);
      for (const mod of summary.modules) {
        sheet.addRow([mod.label, mod.scenario_count]);
      }
      break;
    }
    default:
      return { ok: false, message: 'Invalid report type' };
  }

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  const label = UAT_REPORT_LABELS[reportType].replace(/\s+/g, '_');
  return {
    ok: true,
    buffer,
    filename: `Quantix_UAT_${label}_${stamp}.xlsx`,
  };
}
