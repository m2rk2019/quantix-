import { FIELD_LABELS } from '@/lib/audit/constants';

const ACTION_LABELS: Record<string, string> = {
  'project.created': 'Project created',
  'project.updated': 'Project updated',
  'project.details_updated': 'Project details updated',
  'project.estimate_setting_changed': 'Estimate setting changed',
  'project.deleted': 'Project deleted',
  'project.status.draft': 'Status changed to Draft',
  'project.status.in_progress': 'Status changed to In Progress',
  'project.status.for_review': 'Submitted for review',
  'project.status.approved': 'Estimate approved',
  'project.status.archived': 'Project archived',
  'project.status.rollback': 'Status rolled back',
  'project.exported': 'Estimate exported to Excel',
  'boq_item.created': 'BOQ item added',
  'boq_item.deleted': 'BOQ item deleted',
  'boq_item.quantity_changed': 'Quantity changed',
  'boq_item.rate_changed': 'Rate changed',
  'boq_item.updated': 'BOQ item updated',
  'wbs.created': 'WBS node added',
  'wbs.updated': 'WBS node updated',
  'wbs.deleted': 'WBS node deleted',
  'wbs.reordered': 'WBS node reordered',
  'wbs.pasted': 'WBS branch pasted',
};

export function getAuditActionLabel(
  action: string,
  field?: string | null
): string {
  const base = ACTION_LABELS[action] ?? action.replaceAll('.', ' ');

  if (field && FIELD_LABELS[field]) {
    return `${base} (${FIELD_LABELS[field]})`;
  }

  return base;
}
