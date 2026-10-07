import type { SmartImportBoqRow } from '@/types/smart-import';

export interface BuiltWbsNode {
  temp_id: string;
  parent_temp_id: string | null;
  wbs_code: string;
  description: string;
  level: number;
  sort_order: number;
  discipline: string;
}

export interface BoqWithWbs extends SmartImportBoqRow {
  wbs_temp_id: string;
}

/**
 * Build a Quantix WBS from BOQ rows (1-based levels to match `wbs_level_check`):
 * Level 1: Discipline (root)
 * Level 2: Group header (section / package)
 * BOQ items attach to the nearest group or discipline node.
 */
export function buildWbsFromBoq(rows: SmartImportBoqRow[]): {
  wbs: BuiltWbsNode[];
  boq: BoqWithWbs[];
} {
  const wbs: BuiltWbsNode[] = [];
  const boq: BoqWithWbs[] = [];
  const disciplineIds = new Map<string, string>();
  const groupIds = new Map<string, string>();
  let disciplineIndex = 0;

  const ensureDiscipline = (discipline: string): string => {
    const existing = disciplineIds.get(discipline);
    if (existing) return existing;
    disciplineIndex += 1;
    const tempId = `disc-${disciplineIndex}`;
    disciplineIds.set(discipline, tempId);
    wbs.push({
      temp_id: tempId,
      parent_temp_id: null,
      wbs_code: String(disciplineIndex),
      description: discipline,
      level: 1,
      sort_order: disciplineIndex - 1,
      discipline,
    });
    return tempId;
  };

  let groupCounter = 0;

  for (const row of rows) {
    const disciplineId = ensureDiscipline(row.discipline);

    if (row.is_group_header) {
      groupCounter += 1;
      const parentCode =
        wbs.find((node) => node.temp_id === disciplineId)?.wbs_code ?? '1';
      const tempId = `grp-${groupCounter}`;
      const key = `${row.discipline}::${row.description}`;
      groupIds.set(key, tempId);
      const siblingCount = wbs.filter(
        (node) => node.parent_temp_id === disciplineId
      ).length;
      wbs.push({
        temp_id: tempId,
        parent_temp_id: disciplineId,
        wbs_code: `${parentCode}.${siblingCount + 1}`,
        description: row.description,
        level: 2,
        sort_order: siblingCount,
        discipline: row.discipline,
      });
      continue;
    }

    const groupKey =
      row.group_path.length > 0
        ? `${row.discipline}::${row.group_path[row.group_path.length - 1]}`
        : null;
    const wbsTempId =
      (groupKey ? groupIds.get(groupKey) : undefined) ?? disciplineId;

    boq.push({
      ...row,
      wbs_temp_id: wbsTempId,
    });
  }

  // Ensure at least one WBS node exists.
  if (wbs.length === 0) {
    wbs.push({
      temp_id: 'disc-1',
      parent_temp_id: null,
      wbs_code: '1',
      description: 'General Requirements',
      level: 1,
      sort_order: 0,
      discipline: 'General Requirements',
    });
  }

  return { wbs, boq };
}
