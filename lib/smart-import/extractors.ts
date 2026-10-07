import type {
  SmartImportBoqRow,
  SmartImportProjectInfo,
  SmartImportResourceRow,
  ClassifiedSheet,
} from '@/types/smart-import';
import { DISCIPLINE_KEYWORDS } from '@/types/smart-import';
import type { RawSheetMatrix } from '@/lib/smart-import/sheet-classifier';

function parseNumber(value: string | undefined): number {
  if (!value?.trim()) return 0;
  const cleaned = value.replace(/,/g, '').replace(/[₱$]/g, '').trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function detectDiscipline(text: string): string {
  const hay = text.toLowerCase().trim();
  // Prefer exact NIA/MCC section titles before keyword heuristics.
  const sectionAliases: Record<string, string> = {
    'general requirements': 'General Requirements',
    structural: 'Structural',
    architectural: 'Architectural',
    mechanical: 'Mechanical',
    electrical: 'Electrical',
    auxiliary: 'Auxiliary',
    plumbing: 'Plumbing',
    'fire protection': 'Fire Protection',
    'allied services': 'Allied Services',
    civil: 'Civil',
    sanitary: 'Sanitary',
  };
  if (sectionAliases[hay]) return sectionAliases[hay];

  for (const row of DISCIPLINE_KEYWORDS) {
    if (row.keywords.some((keyword) => hay.includes(keyword))) {
      return row.discipline;
    }
  }
  return 'General Requirements';
}

/**
 * NIA/MCC BCB indents descriptions by hierarchy across columns:
 * section (B) → package (C) → sub-package (D) → detail (E).
 * Header mapping usually points at "ITEM" (D); scan left and right.
 */
function resolveBoqDescription(
  row: string[],
  descriptionCol: number | undefined
): { description: string; column: number } {
  const tryCol = (idx: number): string => (row[idx] ?? '').trim();

  if (descriptionCol !== undefined) {
    const primary = tryCol(descriptionCol);
    if (primary) return { description: primary, column: descriptionCol };
    // Left of ITEM (packages / sections), then right (detail lines).
    for (const offset of [1, 2, 3, -1, -2, -3]) {
      const idx = descriptionCol - offset;
      if (idx < 0 || idx >= row.length) continue;
      const text = tryCol(idx);
      if (text && !/^\d+(\.\d+)*$/.test(text)) {
        return { description: text, column: idx };
      }
    }
  }

  for (let idx = 1; idx <= 5; idx += 1) {
    const text = tryCol(idx);
    if (text && !/^\d+(\.\d+)*$/.test(text)) {
      return { description: text, column: idx };
    }
  }
  return { description: '', column: descriptionCol ?? 1 };
}

/**
 * NIA electrical panels list an assembly row and a "MAIN:" breaker row
 * with the same Total Cost. Keep the MAIN / measurable detail only.
 * Do NOT collapse genuine same-priced siblings (e.g. Elevator-01/02).
 */
function shouldSkipDuplicateSibling(
  result: SmartImportBoqRow[],
  candidate: {
    amount: number;
    unit: string;
    description: string;
    descColumn: number;
    groupPath: string[];
  }
): boolean {
  if (candidate.amount <= 0 || result.length === 0) return false;

  // Find the immediately preceding leaf in the same group path.
  let prev: SmartImportBoqRow | null = null;
  let prevIndex = -1;
  for (let i = result.length - 1; i >= 0; i -= 1) {
    const row = result[i];
    if (row.is_group_header) break;
    if (row.group_path.join('|') !== candidate.groupPath.join('|')) break;
    prev = row;
    prevIndex = i;
    break;
  }
  if (!prev || Math.abs(prev.amount - candidate.amount) > 0.02) return false;

  const prevIsLot = prev.unit.toLowerCase() === 'lot';
  const curIsLot = candidate.unit.toLowerCase() === 'lot';
  const prevIsMain = /^main\s*:/i.test(prev.description);
  const curIsMain = /^main\s*:/i.test(candidate.description);
  const isAssemblyMainPair = prevIsMain || curIsMain;
  const isLotDetailPair =
    (prevIsLot && !curIsLot) || (!prevIsLot && curIsLot);
  // Column-indent duplicate: package text in D, detail in E, same amount.
  const isColumnIndentPair = Math.abs(candidate.descColumn - 4) <= 2 && prevIsLot !== curIsLot;

  if (!isAssemblyMainPair && !isLotDetailPair && !isColumnIndentPair) {
    return false;
  }

  const preferCandidate =
    (curIsMain && !prevIsMain) ||
    (!curIsLot && prevIsLot) ||
    (candidate.descColumn > 4 && !curIsLot);

  if (preferCandidate) {
    result.splice(prevIndex, 1);
    return false;
  }
  return true;
}

/**
 * Rollup rows (lot packages / column-indented parents) whose following
 * rows carry the real measurable BOQ must not be imported as leaves.
 */
function isBoqRollupParent(
  rows: string[][],
  rowIndex: number,
  unit: string,
  quantity: number,
  amount: number,
  descriptionCol: number | undefined,
  unitCol: number | undefined,
  amountCol: number | undefined,
  descColumn: number,
  outlineLevels: number[] | undefined
): boolean {
  if (amount <= 0) return false;
  const unitNorm = unit.toLowerCase();
  const level = outlineLevels?.[rowIndex] ?? 0;
  const hasOutline =
    Boolean(outlineLevels) && outlineLevels!.length === rows.length;

  // Outline children ⇒ parent rollup (any unit).
  if (hasOutline) {
    for (let look = rowIndex + 1; look < rows.length; look += 1) {
      const next = rows[look] ?? [];
      const nextLevel = outlineLevels![look] ?? 0;
      const nextResolved = resolveBoqDescription(next, descriptionCol);
      const nextUnit =
        unitCol !== undefined ? String(next[unitCol] ?? '').trim() : '';
      if (!nextResolved.description && !nextUnit) continue;
      if (/^grand\s*total$/i.test(nextResolved.description)) break;
      if (/^\d+\.0$/.test(String(next[0] ?? '').trim())) break;
      if (nextLevel > level) return true;
      if (nextLevel <= level) break;
    }
  }

  // Column-indent assembly: same-outline follow-ons with description further
  // right whose amounts sum to this package (e.g. MC2 + MAIN/KW-hr components).
  if (hasOutline && amountCol !== undefined) {
    let childSum = 0;
    const scanEnd = Math.min(rowIndex + 40, rows.length);
    for (let look = rowIndex + 1; look < scanEnd; look += 1) {
      const next = rows[look] ?? [];
      const nextLevel = outlineLevels![look] ?? 0;
      if (nextLevel < level) break;
      if (nextLevel > level) break;
      const nextResolved = resolveBoqDescription(next, descriptionCol);
      if (!nextResolved.description) continue;
      if (/^grand\s*total$/i.test(nextResolved.description)) break;
      if (/^\d+\.0$/.test(String(next[0] ?? '').trim())) break;
      if (nextResolved.column <= descColumn) break;
      const nextAmount = parseNumber(next[amountCol]);
      if (nextAmount <= 0) continue;
      childSum += nextAmount;
      if (Math.abs(childSum - amount) <= 0.02) return true;
      if (childSum > amount + 0.02) break;
    }
  }

  // Lot / column-indent parents: keep scanning through child lot rows
  // (description further right) until a non-lot detail appears.
  if (unitNorm !== 'lot' || quantity !== 1) return false;

  const scanEnd = Math.min(rowIndex + 40, rows.length);
  for (let look = rowIndex + 1; look < scanEnd; look += 1) {
    const next = rows[look] ?? [];
    const nextResolved = resolveBoqDescription(next, descriptionCol);
    if (!nextResolved.description) continue;
    if (/^grand\s*total$/i.test(nextResolved.description)) break;
    if (/^\d+\.0$/.test(String(next[0] ?? '').trim())) break;

    const nextUnit =
      unitCol !== undefined ? String(next[unitCol] ?? '').trim() : '';
    if (!nextUnit) continue;

    const nextLevel = hasOutline ? (outlineLevels![look] ?? 0) : null;

    if (nextUnit.toLowerCase() !== 'lot') {
      // Require true child evidence when outline levels are available:
      // deeper outline, or same-level description indented further right.
      // Sibling / uncle rows (lower or same-level same column) must not
      // falsely mark a priced lot leaf as a rollup parent.
      if (nextLevel !== null) {
        if (nextLevel < level) break;
        if (nextLevel > level) return true;
        if (nextResolved.column > descColumn) return true;
        break;
      }
      return true;
    }
    // Child lot (indented further right) — keep looking for measurable detail.
    if (nextResolved.column > descColumn) {
      continue;
    }
    // Sibling / higher lot package — stop.
    break;
  }
  return false;
}

const INFO_ALIASES: Array<[keyof SmartImportProjectInfo, string[]]> = [
  ['project_name', ['project name', 'project title', 'name of project', 'project']],
  ['client_name', ['client', 'owner', 'employer']],
  ['location', ['location', 'site', 'address']],
  ['building_type', ['building type', 'type of building']],
  ['contract_type', ['contract type', 'procurement', 'package']],
  ['project_category', ['project category', 'category']],
  ['cfa_sqm', ['cfa', 'gfa', 'floor area']],
  [
    'number_of_buildings',
    ['number of buildings', 'no. of buildings', '# of bldgs', '# of bldg', 'buildings'],
  ],
  [
    'number_of_units',
    ['number of units', 'no. of units', '# of units', 'units'],
  ],
  ['estimate_date', ['date', 'estimate date', 'prepared date']],
  ['revision', ['revision', 'rev', 'version']],
  ['currency', ['currency']],
  ['prepared_by', ['prepared by', 'estimator', 'prepared']],
];

export function extractProjectInfo(
  sheets: RawSheetMatrix[],
  classified: ClassifiedSheet[]
): SmartImportProjectInfo {
  const info: SmartImportProjectInfo = {
    project_name: 'Imported Project',
    client_name: 'Unknown Client',
    location: null,
    building_type: null,
    contract_type: null,
    project_category: null,
    cfa_sqm: null,
    number_of_buildings: null,
    number_of_units: null,
    estimate_date: null,
    revision: null,
    currency: 'PHP',
    prepared_by: null,
  };

  // Prefer BOQ/BCB sheets for header metadata (CFA / buildings), then cover/summary.
  const preferred = classified
    .filter(
      (sheet) =>
        sheet.role === 'cost_breakdown' ||
        sheet.role === 'boq' ||
        sheet.role === 'project_info' ||
        sheet.role === 'bid_summary'
    )
    .map((sheet) => sheet.sheet_name);
  const ordered = [
    ...sheets.filter((sheet) => preferred.includes(sheet.sheet_name)),
    ...sheets.filter((sheet) => !preferred.includes(sheet.sheet_name)),
  ];

  for (const sheet of ordered) {
    for (const row of sheet.rows.slice(0, 80)) {
      // Support "Project:" | "" | "Name" (NIA/MCC BCB) and "Project" | ":" | "Name"
      const keyRaw = (row[0] ?? '').toLowerCase().replace(/[:]/g, '').trim();
      const valueCandidates = [row[1], row[2], row[3]]
        .map((cell) => (cell ?? '').trim())
        .filter((cell) => cell && cell !== ':');
      const value = valueCandidates[0] ?? '';
      if (!keyRaw) continue;

      for (const [field, aliases] of INFO_ALIASES) {
        if (!aliases.some((alias) => keyRaw === alias || keyRaw.includes(alias))) {
          continue;
        }
        if (!value && field !== 'cfa_sqm') continue;
        if (field === 'cfa_sqm' || field === 'number_of_buildings' || field === 'number_of_units') {
          const current = (info as unknown as Record<string, unknown>)[field];
          if (current == null) {
            (info as unknown as Record<string, unknown>)[field] =
              parseNumber(value) || null;
          }
        } else if (value) {
          const current = (info as unknown as Record<string, unknown>)[field];
          const isDefault =
            (field === 'project_name' && current === 'Imported Project') ||
            (field === 'client_name' && current === 'Unknown Client') ||
            current == null ||
            current === '';
          if (isDefault) {
            (info as unknown as Record<string, unknown>)[field] = value;
          }
        }
      }

      // Same-row metadata: "CFA (m2) :" | 12013 in adjacent cells (NIA BCB)
      for (let c = 0; c < row.length - 1; c += 1) {
        const label = (row[c] ?? '').toLowerCase().replace(/[:]/g, '').trim();
        const adjacent = (row[c + 1] ?? '').trim();
        if (!label || !adjacent) continue;
        if (
          (label.includes('cfa') || label.includes('gfa') || label.includes('floor area')) &&
          !info.cfa_sqm
        ) {
          info.cfa_sqm = parseNumber(adjacent) || null;
        }
        if (
          (label.includes('# of units') ||
            label.includes('no. of units') ||
            label.includes('number of units') ||
            label === 'units') &&
          !info.number_of_units
        ) {
          info.number_of_units = parseNumber(adjacent) || null;
        }
        if (
          (label.includes('# of bldg') ||
            label.includes('no. of bldg') ||
            label.includes('number of buildings') ||
            label.includes('no. of buildings')) &&
          info.number_of_buildings == null
        ) {
          info.number_of_buildings = parseNumber(adjacent) || null;
        }
      }
    }
  }

  // Package / title fallbacks when project_name stayed default
  if (info.project_name === 'Imported Project') {
    for (const sheet of ordered) {
      for (const row of sheet.rows.slice(0, 20)) {
        const key = (row[0] ?? '').toLowerCase().replace(/[:]/g, '').trim();
        const value = [row[1], row[2], row[3]]
          .map((cell) => (cell ?? '').trim())
          .find((cell) => cell && cell !== ':');
        if (key.startsWith('project') && value) {
          info.project_name = value;
          break;
        }
      }
      if (info.project_name !== 'Imported Project') break;
    }
  }

  return info;
}

export function extractBoqRows(
  sheets: RawSheetMatrix[],
  classified: ClassifiedSheet[]
): SmartImportBoqRow[] {
  const boqSheets = classified.filter(
    (sheet) =>
      sheet.role === 'boq' ||
      sheet.role === 'cost_breakdown' ||
      (sheet.header_row !== null &&
        sheet.columns.description !== undefined &&
        sheet.columns.amount !== undefined)
  );

  const result: SmartImportBoqRow[] = [];
  let sortOrder = 0;
  let groupPath: string[] = [];
  let activeDiscipline = 'General Requirements';

  for (const meta of boqSheets) {
    const matrix = sheets.find((sheet) => sheet.sheet_name === meta.sheet_name);
    if (!matrix || meta.header_row === null) continue;

    const cols = meta.columns;
    const start = meta.header_row + 1;
    // NIA BCB places GRAND TOTAL near the top (summary banner). Direct-cost
    // disciplines follow; commercial add-ons (contingency/OCM/tax) come later.
    let pastDirectCost = false;

    for (let r = start; r < matrix.rows.length; r += 1) {
      const row = matrix.rows[r] ?? [];
      // NIA BCB: item codes often live in column A even when header maps ITEM→description.
      const itemNumber =
        cols.item_number !== undefined
          ? (row[cols.item_number] ?? '').trim()
          : (row[0] ?? '').trim().match(/^\d+(\.\d+)*$/)
            ? (row[0] ?? '').trim()
            : '';

      const resolved = resolveBoqDescription(row, cols.description);
      const description = resolved.description;
      if (!description) continue;

      // Skip summary / rollup total banners (top GRAND TOTAL and footer VAT Ex).
      if (/grand\s*total/i.test(description)) {
        continue;
      }
      // Exact commercial section titles only — do not match "Overhead Water Tank".
      if (
        /^(contingency|financial cost|overhead|project mark-?up|mark-?up|taxes|vat|bid price.*|reviewed and agreed by:.*)$/i.test(
          description.trim()
        )
      ) {
        pastDirectCost = true;
      }
      if (pastDirectCost) {
        continue;
      }

      const unit = cols.unit !== undefined ? (row[cols.unit] ?? '').trim() : '';
      const quantity =
        cols.quantity !== undefined ? parseNumber(row[cols.quantity]) : 0;
      let unitRate =
        cols.unit_rate !== undefined ? parseNumber(row[cols.unit_rate]) : 0;
      let amount = cols.amount !== undefined ? parseNumber(row[cols.amount]) : 0;
      if (amount === 0 && quantity > 0 && unitRate > 0) {
        amount = quantity * unitRate;
      }
      // Real BCB: Total Cost is authoritative; derive composite unit rate from it.
      if (amount > 0 && quantity > 0) {
        const derived = amount / quantity;
        if (unitRate === 0 || Math.abs(derived - unitRate) / derived > 0.05) {
          unitRate = derived;
        }
      }

      const sectionCode = /^\d+\.0$/.test(itemNumber);
      const isRollupParent =
        !sectionCode &&
        isBoqRollupParent(
          matrix.rows,
          r,
          unit,
          quantity,
          amount,
          cols.description,
          cols.unit,
          cols.amount,
          resolved.column,
          matrix.outline_levels
        );

      const looksLikeHeader =
        sectionCode ||
        isRollupParent ||
        (!unit &&
          quantity === 0 &&
          unitRate === 0 &&
          amount === 0 &&
          description.length > 2);

      const excelRow =
        matrix.excel_row_numbers?.[r] !== undefined
          ? matrix.excel_row_numbers[r]
          : r + 1;

      if (looksLikeHeader) {
        // Section codes (1.0, 2.0, …) set the discipline for following leaves.
        if (sectionCode) {
          activeDiscipline = detectDiscipline(description);
          groupPath = [description];
        } else {
          groupPath = [...groupPath.slice(0, 1), description];
        }
        result.push({
          row_index: excelRow,
          item_number: itemNumber || `SEC-${sortOrder + 1}`,
          description,
          unit: '',
          quantity: 0,
          unit_rate: 0,
          amount: 0,
          is_group_header: true,
          group_path: [...groupPath],
          discipline: activeDiscipline,
          sort_order: sortOrder,
        });
        sortOrder += 1;
        continue;
      }

      if (!unit && quantity === 0 && unitRate === 0 && amount === 0) {
        continue;
      }
      // Exclude zero-cost allowance / "By Tenant" placeholders from priced BOQ.
      if (amount === 0 && unitRate === 0) {
        continue;
      }

      // Keep leaf discipline aligned to the active BCB section (not item keywords).
      const discipline = activeDiscipline;
      if (
        shouldSkipDuplicateSibling(result, {
          amount,
          unit: unit || 'item',
          description,
          descColumn: resolved.column,
          groupPath: [...groupPath],
        })
      ) {
        continue;
      }

      result.push({
        row_index: excelRow,
        item_number: itemNumber || `ITEM-${sortOrder + 1}`,
        description,
        unit: unit || 'item',
        quantity,
        unit_rate: unitRate,
        amount,
        is_group_header: false,
        group_path: [...groupPath],
        discipline,
        sort_order: sortOrder,
      });
      sortOrder += 1;
    }
  }

  return result;
}

export function extractResourceRows(
  sheets: RawSheetMatrix[],
  classified: ClassifiedSheet[]
): SmartImportResourceRow[] {
  const targets = classified.filter((sheet) => sheet.role === 'resource_analysis');
  const rows: SmartImportResourceRow[] = [];

  for (const meta of targets) {
    const matrix = sheets.find((sheet) => sheet.sheet_name === meta.sheet_name);
    if (!matrix) continue;
    const headerIdx =
      meta.header_row ??
      matrix.rows.findIndex((row) =>
        row.some((cell) => /description|resource/i.test(cell))
      );
    if (headerIdx < 0) continue;
    const headers = matrix.rows[headerIdx].map((cell) => cell.toLowerCase());
    const descIdx = headers.findIndex((h) => h.includes('description') || h.includes('resource'));
    const codeIdx = headers.findIndex((h) => h === 'code' || h.includes('item'));
    const unitIdx = headers.findIndex((h) => h === 'unit' || h.includes('uom'));
    const costIdx = headers.findIndex(
      (h) => h.includes('unit cost') || h.includes('rate') || h === 'cost'
    );
    const catIdx = headers.findIndex((h) => h.includes('category') || h.includes('type'));

    for (let r = headerIdx + 1; r < matrix.rows.length; r += 1) {
      const row = matrix.rows[r];
      const description = (descIdx >= 0 ? row[descIdx] : row[1] ?? '').trim();
      if (!description) continue;
      rows.push({
        code: (codeIdx >= 0 ? row[codeIdx] : `RES-${rows.length + 1}`).trim() || `RES-${rows.length + 1}`,
        description,
        unit: (unitIdx >= 0 ? row[unitIdx] : 'item').trim() || 'item',
        unit_cost: parseNumber(costIdx >= 0 ? row[costIdx] : '0'),
        category: ((catIdx >= 0 ? row[catIdx] : 'material') || 'material')
          .toLowerCase()
          .includes('labor')
          ? 'labor'
          : ((catIdx >= 0 ? row[catIdx] : 'material') || 'material')
                .toLowerCase()
                .includes('equip')
            ? 'equipment'
            : ((catIdx >= 0 ? row[catIdx] : 'material') || 'material')
                  .toLowerCase()
                  .includes('sub')
              ? 'subcontract'
              : 'material',
      });
    }
  }

  return rows;
}

export function extractNarrative(
  sheets: RawSheetMatrix[],
  classified: ClassifiedSheet[],
  role: 'assumptions' | 'notes'
): string {
  const targets = classified.filter(
    (sheet) => sheet.role === role || (role === 'notes' && sheet.role === 'assumptions')
  );
  const chunks: string[] = [];
  for (const meta of targets) {
    const matrix = sheets.find((sheet) => sheet.sheet_name === meta.sheet_name);
    if (!matrix) continue;
    for (const row of matrix.rows) {
      const line = row.filter(Boolean).join(' — ').trim();
      if (line) chunks.push(line);
    }
  }
  return chunks.slice(0, 40).join('\n');
}

export function extractBidSummary(
  sheets: RawSheetMatrix[],
  classified: ClassifiedSheet[]
): Record<string, number> {
  const summary: Record<string, number> = {};
  const targets = classified.filter(
    (sheet) => sheet.role === 'bid_summary' || sheet.role === 'summary'
  );
  const aliases: Array<[string, string[]]> = [
    ['direct_cost', ['direct cost', 'direct']],
    ['indirect_cost', ['indirect', 'ocm', 'overhead']],
    ['material_cost', ['material']],
    ['labor_cost', ['labor', 'labour']],
    ['equipment_cost', ['equipment']],
    ['subcontract_cost', ['subcontract']],
    ['profit', ['profit', 'markup']],
    ['vat', ['vat', 'tax']],
    ['bid_price', ['bid price', 'grand total', 'total bid']],
  ];

  for (const meta of targets) {
    const matrix = sheets.find((sheet) => sheet.sheet_name === meta.sheet_name);
    if (!matrix) continue;
    for (const row of matrix.rows) {
      const key = (row[0] ?? '').toLowerCase();
      const value = parseNumber(row[1]) || parseNumber(row[2]) || parseNumber(row[5]) || parseNumber(row[6]);
      for (const [field, keys] of aliases) {
        if (keys.some((alias) => key.includes(alias))) {
          summary[field] = value;
        }
      }
      // NIA Bid Summary: package row with COST / BLDG in column 6
      const joined = row.map((cell) => (cell ?? '').toLowerCase()).join(' | ');
      if (joined.includes('buildings') && parseNumber(row[5]) > 0) {
        summary.direct_cost = summary.direct_cost || parseNumber(row[5]);
        summary.bid_price = summary.bid_price || parseNumber(row[6]) || parseNumber(row[5]);
      }
    }
  }

  // Fallback: GRAND TOTAL / Total Cost on BOQ / cost_breakdown sheets
  if (!summary.direct_cost && !summary.bid_price) {
    for (const sheet of sheets) {
      for (const row of sheet.rows.slice(0, 40)) {
        const label = row.map((cell) => (cell ?? '').toLowerCase()).join(' ');
        if (!label.includes('grand total')) continue;
        for (let c = row.length - 1; c >= 0; c -= 1) {
          const n = parseNumber(row[c]);
          if (n > 0) {
            summary.direct_cost = n;
            summary.bid_price = n;
            break;
          }
        }
      }
    }
  }

  return summary;
}
