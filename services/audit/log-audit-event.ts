import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';
import type { AuditModule } from '@/types/audit';

export interface LogAuditEventParams {
  projectId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  actorId: string;
  module: AuditModule;
  oldValue?: string | null;
  newValue?: string | null;
  remarks?: string | null;
  payload?: Record<string, Json>;
}

export async function logAuditEvent(params: LogAuditEventParams): Promise<void> {
  const supabase = await createClient();

  const payload: Record<string, Json> = {
    module: params.module,
    ...(params.payload ?? {}),
  };

  if (params.oldValue !== undefined) {
    payload.old_value = params.oldValue;
  }

  if (params.newValue !== undefined) {
    payload.new_value = params.newValue;
  }

  if (params.remarks) {
    payload.remarks = params.remarks;
  }

  if (params.payload?.field) {
    payload.field = params.payload.field;
  }

  await supabase.from('audit_log').insert({
    project_id: params.projectId ?? null,
    entity_type: params.entityType,
    entity_id: params.entityId,
    action: params.action,
    actor_id: params.actorId,
    payload: payload as Json,
  });
}

export interface ProjectAuditChange {
  action: string;
  field?: string;
  oldValue?: string | null;
  newValue?: string | null;
  remarks?: string | null;
}

export async function logProjectAuditChanges(params: {
  projectId: string;
  entityType: string;
  entityId: string;
  actorId: string;
  module: AuditModule;
  changes: ProjectAuditChange[];
  payload?: Record<string, Json>;
}): Promise<void> {
  if (params.changes.length === 0) {
    return;
  }

  const supabase = await createClient();

  const rows = params.changes.map((change) => {
    const payload: Record<string, Json> = {
      module: params.module,
      ...(params.payload ?? {}),
    };

    if (change.field) {
      payload.field = change.field;
    }

    if (change.oldValue !== undefined) {
      payload.old_value = change.oldValue;
    }

    if (change.newValue !== undefined) {
      payload.new_value = change.newValue;
    }

    if (change.remarks) {
      payload.remarks = change.remarks;
    }

    return {
      project_id: params.projectId,
      entity_type: params.entityType,
      entity_id: params.entityId,
      action: change.action,
      actor_id: params.actorId,
      payload: payload as Json,
    };
  });

  await supabase.from('audit_log').insert(rows);
}
