import type {
  ClassifiedSheet,
  SmartImportSheetRole,
} from '@/types/smart-import';
import { MCC_PROFILE_KEY, MCC_PROFILE_NAME } from '@/types/smart-import';

export interface RawSheetMatrix {
  sheet_name: string;
  rows: string[][];
  /** Excel outlineLevel per matrix row (aligned with rows[]). */
  outline_levels?: number[];
  /** 1-based Excel row numbers aligned with rows[] (when available). */
  excel_row_numbers?: number[];
}

const ROLE_HINTS: Array<{ role: SmartImportSheetRole; hints: string[] }> = [
  {
    role: 'project_info',
    hints: [
      'project name',
      'client',
      'location',
      'prepared by',
      'building type',
      'contract type',
      'cfa',
      'revision',
    ],
  },
  {
    role: 'bid_summary',
    hints: [
      'direct cost',
      'indirect cost',
      'vat',
      'grand total',
      'bid price',
      'profit',
      'markup',
    ],
  },
  {
    role: 'boq',
    hints: [
      'item no',
      'item number',
      'description',
      'unit',
      'qty',
      'quantity',
      'unit rate',
      'amount',
    ],
  },
  {
    role: 'cost_breakdown',
    hints: ['cost breakdown', 'material cost', 'labor cost', 'equipment cost'],
  },
  {
    role: 'resource_analysis',
    hints: [
      'resource',
      'material',
      'labor',
      'equipment',
      'unit cost',
      'consumption',
      'productivity',
      'rate analysis',
    ],
  },
  {
    role: 'summary',
    hints: ['summary', 'estimate summary', 'total amount'],
  },
  {
    role: 'assumptions',
    hints: ['assumption', 'basis of estimate'],
  },
  {
    role: 'notes',
    hints: ['exclusion', 'commercial note', 'note', 'remark'],
  },
];

const COLUMN_ALIASES: Record<string, string[]> = {
  item_number: ['item no', 'item no.', 'item number', 'item#', 'item code', 'code'],
  // "item" covers MCC/NIA BCB header "ITEM" (description column)
  description: ['description', 'particulars', 'scope', 'works', 'item'],
  unit: ['unit', 'uom', 'unit of measure'],
  quantity: ['qty', 'qty.', 'quantity', 'quanitity'],
  // Prefer explicit unit-rate labels before bare "rate" (avoids Material Rate only)
  unit_rate: [
    'unit rate',
    'unit cost',
    'ur',
    'total rate',
    'composite rate',
    'rate',
  ],
  amount: [
    'total cost',
    'total amount',
    'amount',
    'extended',
    'total',
  ],
};

function normalizeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value === 'object') {
    const obj = value as {
      result?: unknown;
      text?: unknown;
      richText?: Array<{ text?: string }>;
      formula?: unknown;
      sharedFormula?: unknown;
    };
    if (obj.result !== null && obj.result !== undefined) {
      return normalizeCell(obj.result);
    }
    if (typeof obj.text === 'string') {
      return obj.text.replace(/\s+/g, ' ').trim();
    }
    if (Array.isArray(obj.richText)) {
      return obj.richText
        .map((part) => part.text ?? '')
        .join('')
        .replace(/\s+/g, ' ')
        .trim();
    }
    // Uncached formula — do not stringify to "[object Object]"
    if ('formula' in obj || 'sharedFormula' in obj) return '';
  }
  return String(value).replace(/\s+/g, ' ').trim();
}

function normalizeHeader(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .toLowerCase()
    .replace(/[:*]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreRole(textBlob: string, role: SmartImportSheetRole): number {
  const hints = ROLE_HINTS.find((row) => row.role === role)?.hints ?? [];
  let score = 0;
  for (const hint of hints) {
    if (textBlob.includes(hint)) score += 2;
  }
  return score;
}

function detectHeaderRow(rows: string[][]): {
  header_row: number | null;
  columns: Partial<Record<string, number>>;
  sample_headers: string[];
} {
  let bestRow = -1;
  let bestScore = 0;
  let bestColumns: Partial<Record<string, number>> = {};
  let sample: string[] = [];

  const maxScan = Math.min(rows.length, 40);
  for (let r = 0; r < maxScan; r += 1) {
    const cells = rows[r] ?? [];
    const normalized = cells.map(normalizeHeader);
    const columns: Partial<Record<string, number>> = {};
    let score = 0;

    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      // Prefer exact header match, then longest alias substring (stable for BCB).
      let idx = -1;
      for (const alias of aliases) {
        const exact = normalized.findIndex(
          (cell) => typeof cell === 'string' && cell === alias
        );
        if (exact >= 0) {
          idx = exact;
          break;
        }
      }
      if (idx < 0) {
        for (const alias of [...aliases].sort((a, b) => b.length - a.length)) {
          const hit = normalized.findIndex(
            (cell) => typeof cell === 'string' && cell.includes(alias)
          );
          if (hit >= 0) {
            idx = hit;
            break;
          }
        }
      }
      if (idx >= 0) {
        columns[field] = idx;
        score += 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestRow = r;
      bestColumns = columns;
      sample = normalized.filter(Boolean).slice(0, 12);
    }
  }

  if (bestScore < 3) {
    return { header_row: null, columns: {}, sample_headers: sample };
  }

  return {
    header_row: bestRow,
    columns: bestColumns,
    sample_headers: sample,
  };
}

export function classifyWorkbookSheets(
  sheets: RawSheetMatrix[]
): ClassifiedSheet[] {
  return sheets.map((sheet) => {
    const textBlob = sheet.rows
      .slice(0, 60)
      .flat()
      .map((cell) => normalizeHeader(cell))
      .join(' | ');

    let bestRole: SmartImportSheetRole = 'unknown';
    let bestScore = 0;
    for (const { role } of ROLE_HINTS) {
      const score = scoreRole(textBlob, role);
      if (score > bestScore) {
        bestScore = score;
        bestRole = role;
      }
    }

    const header = detectHeaderRow(sheet.rows);
    const hasBoqShape =
      header.header_row !== null &&
      header.columns.description !== undefined &&
      header.columns.quantity !== undefined &&
      (header.columns.amount !== undefined || header.columns.unit_rate !== undefined);
    const hasClassicBoq =
      hasBoqShape && header.columns.item_number !== undefined;
    const hasCostBreakdownHeaders =
      textBlob.includes('material cost') &&
      textBlob.includes('labor cost') &&
      (textBlob.includes('total cost') || textBlob.includes('quantity'));

    // Real BCB workbooks often mention "bid price" in a cover banner — do not let
    // that override a sheet that clearly has BOQ / cost-breakdown columns.
    if (hasCostBreakdownHeaders && hasBoqShape) {
      bestRole = 'cost_breakdown';
      bestScore = Math.max(bestScore, 12);
    } else if (hasClassicBoq || hasBoqShape) {
      if (bestRole === 'unknown' || bestRole === 'bid_summary' || bestScore < 8) {
        bestRole = 'boq';
        bestScore = Math.max(bestScore, 10);
      }
    }

    return {
      sheet_name: sheet.sheet_name,
      role: bestRole,
      confidence: Math.min(1, bestScore / 12),
      header_row: header.header_row,
      columns: header.columns,
      sample_headers: header.sample_headers,
    };
  });
}

export function matchImportProfile(
  sheets: ClassifiedSheet[]
): { profile_key: string; display_name: string; confidence: number } | null {
  const roles = new Set(sheets.map((sheet) => sheet.role));
  const hasBoq = roles.has('boq');
  const hasInfo = roles.has('project_info') || roles.has('bid_summary');
  const boqSheet = sheets.find((sheet) => sheet.role === 'boq');
  const hasClassicHeaders =
    boqSheet?.columns.item_number !== undefined &&
    boqSheet?.columns.description !== undefined &&
    boqSheet?.columns.unit_rate !== undefined;

  if (hasBoq && hasClassicHeaders) {
    return {
      profile_key: MCC_PROFILE_KEY,
      display_name: MCC_PROFILE_NAME,
      confidence: hasInfo ? 0.92 : 0.8,
    };
  }

  return null;
}

/** Minimal ExcelJS-like sheet shape used only for typing (behavior unchanged). */
export type SheetToMatrixInput = {
  name: string;
  eachRow: (
    callback: (
      row: { values: unknown; outlineLevel?: number },
      rowNumber: number
    ) => void
  ) => void;
};

export function sheetToMatrix(sheet: SheetToMatrixInput): RawSheetMatrix {
  const rows: string[][] = [];
  const outline_levels: number[] = [];
  const excel_row_numbers: number[] = [];
  sheet.eachRow((row, rowNumber) => {
    const values = Array.isArray(row.values) ? row.values.slice(1) : [];
    // ExcelJS sparse row.values — materialize dense string cells
    const dense: string[] = [];
    for (let i = 0; i < values.length; i += 1) {
      dense[i] = normalizeCell(values[i]);
    }
    rows.push(dense);
    outline_levels.push(Number(row.outlineLevel || 0));
    excel_row_numbers.push(rowNumber);
  });
  return { sheet_name: sheet.name, rows, outline_levels, excel_row_numbers };
}
