import { getAuditActionLabel } from '@/lib/audit/action-labels';
import {
  formatAuditDate,
  formatAuditTime,
} from '@/lib/audit/format-audit-value';
import { requireUserProfile } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { getProjectById } from '@/services/projects/list-projects';
import type {
  AuditHistoryEntry,
  AuditHistoryFilters,
  AuditHistoryResult,
  AuditModule,
} from '@/types/audit';
import { AUDIT_MODULE_LABELS, AUDIT_MODULES } from '@/types/audit';
import { isUserRole } from '@/types/auth';

const MAX_AUDIT_ROWS = 500;

function parsePayloadObject(
  payload: unknown
): Record<string, unknown> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {};
  }

  return payload as Record<string, unknown>;
}

function parseAuditModule(value: unknown, action: string): AuditModule {
  if (
    typeof value === 'string' &&
    (AUDIT_MODULES as readonly string[]).includes(value)
  ) {
    return value as AuditModule;
  }

  if (action.startsWith('boq_item.')) {
    return 'boq';
  }

  if (action.startsWith('wbs.')) {
    return 'wbs';
  }

  if (action.startsWith('project.status.')) {
    return 'lifecycle';
  }

  return 'project_details';
}

function mapAuditRow(row: {
  id: string;
  action: string;
  actor_id: string | null;
  payload: unknown;
  created_at: string;
  actor: { full_name: string; role: string } | null;
}): AuditHistoryEntry {
  const payload = parsePayloadObject(row.payload);
  const field =
    typeof payload.field === 'string' ? payload.field : null;
  const auditModule = parseAuditModule(payload.module, row.action);
  const oldValue =
    typeof payload.old_value === 'string' || payload.old_value === null
      ? (payload.old_value as string | null)
      : payload.old_value !== undefined
        ? String(payload.old_value)
        : null;
  const newValue =
    typeof payload.new_value === 'string' || payload.new_value === null
      ? (payload.new_value as string | null)
      : payload.new_value !== undefined
        ? String(payload.new_value)
        : null;
  const remarks =
    typeof payload.remarks === 'string' ? payload.remarks : null;

  const userRole =
    row.actor?.role && isUserRole(row.actor.role) ? row.actor.role : null;

  return {
    id: row.id,
    date: formatAuditDate(row.created_at),
    time: formatAuditTime(row.created_at),
    createdAt: row.created_at,
    userId: row.actor_id,
    userName: row.actor?.full_name ?? 'System',
    userRole,
    action: row.action,
    actionLabel: getAuditActionLabel(row.action, field),
    module: auditModule,
    moduleLabel: AUDIT_MODULE_LABELS[auditModule],
    oldValue,
    newValue,
    remarks,
  };
}

export async function listAuditHistory(
  projectId: string,
  filters: AuditHistoryFilters = {}
): Promise<AuditHistoryResult> {
  await requireUserProfile();

  const project = await getProjectById(projectId);
  if (!project) {
    return { entries: [], users: [], total: 0 };
  }

  const supabase = await createClient();

  let query = supabase
    .from('audit_log')
    .select(
      `
        id,
        action,
        actor_id,
        payload,
        created_at,
        actor:users!audit_log_actor_id_fkey(full_name, role)
      `,
      { count: 'exact' }
    )
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(MAX_AUDIT_ROWS);

  if (filters.userId) {
    query = query.eq('actor_id', filters.userId);
  }

  if (filters.dateFrom) {
    query = query.gte('created_at', `${filters.dateFrom}T00:00:00.000Z`);
  }

  if (filters.dateTo) {
    query = query.lte('created_at', `${filters.dateTo}T23:59:59.999Z`);
  }

  const { data, error, count } = await query;

  if (error || !data) {
    return { entries: [], users: [], total: 0 };
  }

  let entries = data.map((row) =>
    mapAuditRow(
      row as {
        id: string;
        action: string;
        actor_id: string | null;
        payload: unknown;
        created_at: string;
        actor: { full_name: string; role: string } | null;
      }
    )
  );

  if (filters.module) {
    entries = entries.filter((entry) => entry.module === filters.module);
  }

  const usersMap = new Map<string, string>();
  for (const entry of entries) {
    if (entry.userId) {
      usersMap.set(entry.userId, entry.userName);
    }
  }

  const users = [...usersMap.entries()]
    .map(([id, fullName]) => ({ id, fullName }))
    .sort((left, right) => left.fullName.localeCompare(right.fullName));

  return {
    entries,
    users,
    total: filters.module ? entries.length : (count ?? entries.length),
  };
}
