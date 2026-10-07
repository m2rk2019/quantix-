import ExcelJS from 'exceljs';

import { getAccuracyDashboard } from '@/services/benchmark/get-accuracy-dashboard';
import { getFormulaAudit } from '@/services/benchmark/get-formula-audit';
import { validateHistoricalProject } from '@/services/benchmark/validate-historical';
import type { BenchmarkReportType } from '@/types/benchmark';
import { BENCHMARK_REPORT_LABELS } from '@/types/benchmark';

export async function exportBenchmarkReportExcel(
  reportType: BenchmarkReportType,
  projectId?: string
): Promise<{ ok: true; buffer: Buffer; filename: string } | { ok: false; message: string }> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Quantix Benchmark';
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  switch (reportType) {
    case 'executive_accuracy': {
      const data = await getAccuracyDashboard();
      const sheet = workbook.addWorksheet('Accuracy Dashboard');
      sheet.addRow(['Metric', 'Value']);
      sheet.addRow(['Overall Accuracy %', data.overall_accuracy_percent]);
      sheet.addRow(['Quantity Accuracy %', data.quantity_accuracy_percent]);
      sheet.addRow(['Rate Accuracy %', data.rate_accuracy_percent]);
      sheet.addRow(['Cost Accuracy %', data.cost_accuracy_percent]);
      sheet.addRow(['Formula Accuracy %', data.formula_accuracy_percent]);
      sheet.addRow(['Calculation Consistency %', data.calculation_consistency_percent]);
      sheet.addRow(['Meets Acceptance', data.meets_acceptance ? 'Yes' : 'No']);
      sheet.addRow([]);
      sheet.addRow(['Project', 'Qty %', 'Rate %', 'Cost %', 'Formula %']);
      for (const result of data.project_results) {
        sheet.addRow([
          result.project_code,
          result.quantity_accuracy_percent,
          result.rate_accuracy_percent,
          result.cost_accuracy_percent,
          result.formula_accuracy_percent,
        ]);
      }
      break;
    }
    case 'validation': {
      if (!projectId) {
        return { ok: false, message: 'projectId required for validation report' };
      }
      const validation = await validateHistoricalProject(projectId);
      if (!validation) {
        return { ok: false, message: 'Project not found' };
      }
      const sheet = workbook.addWorksheet('Validation');
      sheet.addRow(['Item', 'Est Qty', 'Act Qty', 'Qty Var %', 'Est Rate', 'Act Rate', 'Rate Var %', 'Est Cost', 'Awarded', 'Cost Var %']);
      for (const row of validation.rows) {
        sheet.addRow([
          row.item_code,
          row.estimated_quantity,
          row.actual_quantity,
          row.quantity_variance_percent,
          row.estimated_unit_rate,
          row.actual_unit_rate,
          row.rate_variance_percent,
          row.estimated_cost,
          row.awarded_cost,
          row.cost_variance_percent,
        ]);
      }
      break;
    }
    case 'formula_audit': {
      if (!projectId) {
        return { ok: false, message: 'projectId required for formula audit report' };
      }
      const audit = await getFormulaAudit(projectId);
      if (!audit) {
        return { ok: false, message: 'No BOQ items for audit' };
      }
      const sheet = workbook.addWorksheet('Formula Audit');
      sheet.addRow(['Item', 'Qty Formula', 'Rate Formula', 'Total Rate', 'Total Amount', 'Passed', 'Issues']);
      for (const line of audit.lines) {
        sheet.addRow([
          line.item_code,
          line.quantity_formula,
          line.rate_formula,
          line.total_rate,
          line.total_amount,
          line.passed ? 'Yes' : 'No',
          line.issues.join('; '),
        ]);
      }
      break;
    }
    case 'lessons_learned': {
      const data = await getAccuracyDashboard();
      const sheet = workbook.addWorksheet('Lessons Learned');
      sheet.addRow(['Lessons Learned']);
      for (const lesson of data.lessons_learned) {
        sheet.addRow([lesson]);
      }
      break;
    }
    default:
      return { ok: false, message: 'Unknown report type' };
  }

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  return {
    ok: true,
    buffer,
    filename: `Quantix_${BENCHMARK_REPORT_LABELS[reportType].replace(/\s+/g, '_')}_${stamp}.xlsx`,
  };
}
