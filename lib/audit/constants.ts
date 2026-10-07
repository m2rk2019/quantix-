import type { AuditModule } from '@/types/audit';

export const BOQ_RATE_FIELDS = [
  'material_rate',
  'labor_rate',
  'equipment_rate',
  'subcontract_rate',
  'other_cost_rate',
] as const;

export const BOQ_AUDIT_FIELDS = [
  'quantity',
  ...BOQ_RATE_FIELDS,
  'description',
  'unit',
  'item_code',
  'wbs_id',
] as const;

export const PROJECT_DETAIL_FIELDS = [
  'project_name',
  'client_name',
  'location',
  'description',
  'owner',
  'consultant',
  'contractor',
  'project_type',
  'contract_type',
] as const;

export const ESTIMATE_SETTING_FIELDS = [
  'currency',
  'vat_percent',
  'markup_percent',
  'contingency_percent',
  'indirect_cost_percent',
  'rounding_rule',
  'measurement_system',
  'default_unit_system',
] as const;

export const FIELD_LABELS: Record<string, string> = {
  quantity: 'Quantity',
  material_rate: 'Material rate',
  labor_rate: 'Labor rate',
  equipment_rate: 'Equipment rate',
  subcontract_rate: 'Subcontract rate',
  other_cost_rate: 'Other cost rate',
  description: 'Description',
  unit: 'Unit',
  item_code: 'Item code',
  wbs_id: 'WBS',
  project_name: 'Project name',
  client_name: 'Client name',
  location: 'Location',
  owner: 'Owner',
  consultant: 'Consultant',
  contractor: 'Contractor',
  project_type: 'Project type',
  contract_type: 'Contract type',
  currency: 'Currency',
  vat_percent: 'VAT %',
  markup_percent: 'Markup %',
  contingency_percent: 'Contingency %',
  indirect_cost_percent: 'Indirect cost %',
  rounding_rule: 'Rounding rule',
  measurement_system: 'Measurement system',
  default_unit_system: 'Default unit system',
};

export function resolveBoqAction(field: string): string {
  if (field === 'quantity') {
    return 'boq_item.quantity_changed';
  }

  if ((BOQ_RATE_FIELDS as readonly string[]).includes(field)) {
    return 'boq_item.rate_changed';
  }

  return 'boq_item.updated';
}

export function resolveModuleForProjectField(field: string): AuditModule {
  if ((ESTIMATE_SETTING_FIELDS as readonly string[]).includes(field)) {
    return 'estimate_settings';
  }

  return 'project_details';
}

export function formatRoleLabel(role: string | null | undefined): string {
  if (!role) {
    return '—';
  }

  return role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
