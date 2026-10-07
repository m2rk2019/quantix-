import type { BoqEditableField, BoqSortField } from '@/types/boq';

export const BOQ_ROW_HEIGHT = 44;

export interface BoqColumnDef {
  id: BoqSortField | 'select' | 'actions';
  label: string;
  width: number;
  minWidth: number;
  editable: boolean;
  align?: 'left' | 'right';
  numeric?: boolean;
}

export const DEFAULT_BOQ_COLUMNS: BoqColumnDef[] = [
  { id: 'select', label: '', width: 40, minWidth: 40, editable: false },
  {
    id: 'item_code',
    label: 'Item No.',
    width: 96,
    minWidth: 72,
    editable: true,
  },
  {
    id: 'description',
    label: 'Description',
    width: 240,
    minWidth: 160,
    editable: true,
  },
  { id: 'unit', label: 'Unit', width: 72, minWidth: 56, editable: true },
  {
    id: 'quantity',
    label: 'Quantity',
    width: 128,
    minWidth: 96,
    editable: true,
    align: 'right',
    numeric: true,
  },
  {
    id: 'material_rate',
    label: 'Material Rate',
    width: 104,
    minWidth: 80,
    editable: true,
    align: 'right',
    numeric: true,
  },
  {
    id: 'labor_rate',
    label: 'Labor Rate',
    width: 96,
    minWidth: 72,
    editable: true,
    align: 'right',
    numeric: true,
  },
  {
    id: 'equipment_rate',
    label: 'Equipment Rate',
    width: 112,
    minWidth: 88,
    editable: true,
    align: 'right',
    numeric: true,
  },
  {
    id: 'subcontract_rate',
    label: 'Subcontract Rate',
    width: 120,
    minWidth: 96,
    editable: true,
    align: 'right',
    numeric: true,
  },
  {
    id: 'other_cost_rate',
    label: 'Other Cost',
    width: 104,
    minWidth: 80,
    editable: true,
    align: 'right',
    numeric: true,
  },
  {
    id: 'total_rate',
    label: 'Total Unit Rate',
    width: 112,
    minWidth: 88,
    editable: false,
    align: 'right',
    numeric: true,
  },
  {
    id: 'total_amount',
    label: 'Total Amount',
    width: 120,
    minWidth: 96,
    editable: false,
    align: 'right',
    numeric: true,
  },
  { id: 'actions', label: '', width: 108, minWidth: 88, editable: false },
];

export const BOQ_EDITABLE_COLUMN_IDS: BoqEditableField[] = [
  'item_code',
  'description',
  'unit',
  'quantity',
  'material_rate',
  'labor_rate',
  'equipment_rate',
  'subcontract_rate',
  'other_cost_rate',
];

export function getNextEditableColumn(
  columnId: string,
  direction: 1 | -1
): BoqEditableField | null {
  const index = BOQ_EDITABLE_COLUMN_IDS.indexOf(columnId as BoqEditableField);
  if (index === -1) {
    return BOQ_EDITABLE_COLUMN_IDS[direction === 1 ? 0 : BOQ_EDITABLE_COLUMN_IDS.length - 1] ?? null;
  }

  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= BOQ_EDITABLE_COLUMN_IDS.length) {
    return null;
  }

  return BOQ_EDITABLE_COLUMN_IDS[nextIndex] ?? null;
}
