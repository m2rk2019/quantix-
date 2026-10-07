import type { BoqEditableField } from '@/types/boq';

export interface BoqRowValidation {
  valid: boolean;
  fieldErrors: Partial<Record<BoqEditableField, string>>;
  message: string | null;
}

interface ValidatableRow {
  item_code: string;
  description: string;
  unit: string;
  quantity: number;
  material_rate: number;
  labor_rate: number;
  equipment_rate: number;
  subcontract_rate: number;
  other_cost_rate: number;
}

export function validateBoqRow(row: ValidatableRow): BoqRowValidation {
  const fieldErrors: Partial<Record<BoqEditableField, string>> = {};

  if (!row.item_code.trim()) {
    fieldErrors.item_code = 'Item number is required.';
  }

  if (!row.description.trim()) {
    fieldErrors.description = 'Description is required.';
  } else if (row.description.length > 500) {
    fieldErrors.description = 'Description must be 500 characters or less.';
  }

  if (!row.unit.trim()) {
    fieldErrors.unit = 'Unit is required.';
  }

  const numericFields: Array<{ field: BoqEditableField; label: string; value: number }> = [
    { field: 'quantity', label: 'Quantity', value: row.quantity },
    { field: 'material_rate', label: 'Material rate', value: row.material_rate },
    { field: 'labor_rate', label: 'Labor rate', value: row.labor_rate },
    { field: 'equipment_rate', label: 'Equipment rate', value: row.equipment_rate },
    { field: 'subcontract_rate', label: 'Subcontract rate', value: row.subcontract_rate },
    { field: 'other_cost_rate', label: 'Other cost rate', value: row.other_cost_rate },
  ];

  for (const { field, label, value } of numericFields) {
    if (!Number.isFinite(value) || value < 0) {
      fieldErrors[field] = `${label} must be ≥ 0.`;
    }
  }

  const messages = Object.values(fieldErrors).filter(Boolean);
  return {
    valid: messages.length === 0,
    fieldErrors,
    message: messages[0] ?? null,
  };
}
