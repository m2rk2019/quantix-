import { formatAuditValue } from '@/lib/audit/format-audit-value';

export interface AuditFieldChange {
  field: string;
  oldValue: string | null;
  newValue: string | null;
}

export function diffAuditFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: readonly string[]
): AuditFieldChange[] {
  const changes: AuditFieldChange[] = [];

  for (const field of fields) {
    const oldValue = formatAuditValue(before[field]);
    const newValue = formatAuditValue(after[field]);

    if (oldValue !== newValue) {
      changes.push({ field, oldValue, newValue });
    }
  }

  return changes;
}
