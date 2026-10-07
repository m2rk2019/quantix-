import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/services/audit/log-audit-event';
import { assertProjectRateEditAccess } from '@/services/project-rate-library/assert-project-rate-access';
import { detectStaleProjectRates } from '@/services/project-rate-library/detect-stale-rates';
import type { SyncProjectRatesResult } from '@/types/project-rate-library';
import type { Json } from '@/types/database';

function parseSyncPayload(data: unknown): {
  updated_count: number;
  updated_ids: string[];
} {
  if (!data || typeof data !== 'object') {
    return { updated_count: 0, updated_ids: [] };
  }
  const payload = data as Record<string, unknown>;
  const ids = Array.isArray(payload.updated_ids)
    ? payload.updated_ids.filter((id): id is string => typeof id === 'string')
    : [];
  return {
    updated_count: Number(payload.updated_count ?? ids.length) || 0,
    updated_ids: ids,
  };
}

async function syncViaAdmin(
  projectId: string,
  itemIds: string[] | null,
  actorId: string
): Promise<SyncProjectRatesResult> {
  const stale = await detectStaleProjectRates(projectId);
  if (stale.error) {
    return { success: false, error: stale.error };
  }

  const targets = stale.items.filter(
    (item) => itemIds === null || itemIds.includes(item.project_item_id)
  );

  if (targets.length === 0) {
    return { success: true, updatedCount: 0, updatedIds: [] };
  }

  const admin = createAdminClient();
  const updatedIds: string[] = [];

  for (const item of targets) {
    const { data, error } = await admin
      .from('project_rate_library_items')
      .update({
        unit_cost: item.company_unit_cost,
        source_unit_cost: item.company_unit_cost,
        source_updated_at: item.company_updated_at,
        updated_by: actorId,
      })
      .eq('id', item.project_item_id)
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .select('id')
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }
    if (data) {
      updatedIds.push(data.id);
    }
  }

  return {
    success: true,
    updatedCount: updatedIds.length,
    updatedIds,
  };
}

export async function syncProjectRatesFromCompany(
  projectId: string,
  itemIds: string[] | null = null
): Promise<SyncProjectRatesResult> {
  const access = await assertProjectRateEditAccess(projectId);
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    'sync_project_rate_library_from_company',
    {
      p_project_id: projectId,
      p_item_ids: itemIds,
      p_actor_id: access.ctx.profileId,
    }
  );

  let result: SyncProjectRatesResult;

  if (error) {
    console.warn(
      '[Project Rate Library] sync RPC unavailable — admin fallback',
      error.message
    );
    result = await syncViaAdmin(projectId, itemIds, access.ctx.profileId);
  } else {
    const parsed = parseSyncPayload(data);
    result = {
      success: true,
      updatedCount: parsed.updated_count,
      updatedIds: parsed.updated_ids,
    };
  }

  if (!result.success) {
    return result;
  }

  // Cascade synced company costs into BOQ analysis lines that reference project copies.
  if ((result.updatedIds ?? []).length > 0) {
    try {
      const admin = createAdminClient();
      const { data: syncedRows } = await admin
        .from('project_rate_library_items')
        .select('id, unit_cost')
        .eq('project_id', projectId)
        .in('id', result.updatedIds ?? []);

      const { cascadeProjectRateCostChange } = await import(
        '@/services/project-rate-library/cascade-project-rate-change'
      );
      for (const row of syncedRows ?? []) {
        await cascadeProjectRateCostChange(
          projectId,
          row.id,
          Number(row.unit_cost),
          access.ctx.profileId
        );
      }
    } catch (cascadeError) {
      console.warn(
        '[Project Rate Library] sync cascade skipped',
        cascadeError
      );
    }
  }

  try {
    await logAuditEvent({
      projectId,
      entityType: 'project_rate_library',
      entityId: projectId,
      action: 'project_rate.synced',
      actorId: access.ctx.profileId,
      module: 'project_rate',
      remarks: `Synced ${result.updatedCount ?? 0} project rate(s) from company`,
      payload: {
        updated_count: result.updatedCount ?? 0,
        updated_ids: (result.updatedIds ?? []) as unknown as Json,
        mode: itemIds === null ? 'all' : 'selected',
      },
    });
  } catch (auditError) {
    console.error('[Project Rate Library] sync audit failed', auditError);
  }

  return result;
}

export async function ignoreProjectRateCompanyUpdates(
  projectId: string,
  itemIds: string[]
): Promise<SyncProjectRatesResult> {
  const uniqueIds = Array.from(new Set(itemIds.filter(Boolean)));
  if (uniqueIds.length === 0) {
    return { success: false, error: 'No project rate items selected.' };
  }

  const access = await assertProjectRateEditAccess(projectId);
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('project_rate_library_items')
    .update({
      ignore_company_updates: true,
      updated_by: access.ctx.profileId,
    })
    .eq('project_id', projectId)
    .in('id', uniqueIds)
    .is('deleted_at', null)
    .select('id');

  if (error) {
    return { success: false, error: error.message };
  }

  const updatedIds = (data ?? []).map((row) => row.id);

  try {
    await logAuditEvent({
      projectId,
      entityType: 'project_rate_library',
      entityId: projectId,
      action: 'project_rate.sync_ignored',
      actorId: access.ctx.profileId,
      module: 'project_rate',
      remarks: `Ignored company updates for ${updatedIds.length} resource(s)`,
      payload: {
        updated_ids: updatedIds as unknown as Json,
      },
    });
  } catch (auditError) {
    console.error('[Project Rate Library] ignore audit failed', auditError);
  }

  return {
    success: true,
    updatedCount: updatedIds.length,
    updatedIds,
  };
}
