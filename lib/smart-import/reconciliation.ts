import type {
  ImportReconciliationLine,
  ImportReconciliationReport,
} from '@/types/master-template';
import { DEFAULT_IMPORT_TOLERANCE_PERCENT } from '@/types/master-template';

export function buildImportReconciliationReport(input: {
  excelBoqTotal: number;
  excelBidPrice: number | null;
  excelDirectCost: number | null;
  quantixDirectCost: number;
  quantixGrandTotal: number;
  tolerancePercent?: number;
}): ImportReconciliationReport {
  const tolerance = input.tolerancePercent ?? DEFAULT_IMPORT_TOLERANCE_PERCENT;
  const notes: string[] = [];

  const lines: ImportReconciliationLine[] = [];

  lines.push(
    compareLine(
      'BOQ / Direct Cost',
      input.excelBoqTotal || input.excelDirectCost || 0,
      input.quantixDirectCost,
      tolerance
    )
  );

  if (input.excelBidPrice != null && input.excelBidPrice > 0) {
    // Grand total includes markups; compare only when Excel bid is present.
    // Allow wider band because Quantix applies company default OCM/VAT chain.
    lines.push(
      compareLine(
        'Bid Price vs Grand Total (informational)',
        input.excelBidPrice,
        input.quantixGrandTotal,
        Math.max(tolerance, 15)
      )
    );
    notes.push(
      'Bid Price comparison allows a wider tolerance because Quantix applies company markup/VAT defaults that may differ from the workbook.'
    );
  } else {
    notes.push('Excel bid price not detected; reconciled against BOQ/direct cost only.');
  }

  const critical = lines.filter((line) => line.label.startsWith('BOQ'));
  const overall_pass = critical.every((line) => line.within_tolerance);

  if (overall_pass) {
    notes.push(
      `Direct cost variance within ±${tolerance}% tolerance.`
    );
  } else {
    notes.push(
      `Direct cost variance exceeds ±${tolerance}% tolerance — review imported quantities/rates.`
    );
  }

  return {
    tolerance_percent: tolerance,
    lines,
    excel_boq_total: input.excelBoqTotal,
    quantix_direct_cost: input.quantixDirectCost,
    excel_bid_price: input.excelBidPrice,
    quantix_grand_total: input.quantixGrandTotal,
    overall_pass,
    notes,
  };
}

function compareLine(
  label: string,
  excelValue: number,
  quantixValue: number,
  tolerancePercent: number
): ImportReconciliationLine {
  const variance = quantixValue - excelValue;
  const base = Math.abs(excelValue) > 0 ? Math.abs(excelValue) : 1;
  const variance_percent = (variance / base) * 100;
  return {
    label,
    excel_value: round2(excelValue),
    quantix_value: round2(quantixValue),
    variance: round2(variance),
    variance_percent: round2(variance_percent),
    within_tolerance: Math.abs(variance_percent) <= tolerancePercent,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
