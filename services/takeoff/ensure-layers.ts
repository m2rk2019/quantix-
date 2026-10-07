'use server';

import { requireProvisionedUserProfile } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_TAKEOFF_LAYERS } from '@/types/takeoff';
import type { Json } from '@/types/database';

export async function ensureDefaultTakeoffLayers(
  projectId: string,
  actorId?: string
): Promise<void> {
  const supabase = await createClient();
  let userId = actorId;
  if (!userId) {
    try {
      const profile = await requireProvisionedUserProfile();
      userId = profile.id;
    } catch {
      return;
    }
  }

  const { data: existing } = await supabase
    .from('takeoff_layers')
    .select('name')
    .eq('project_id', projectId)
    .is('deleted_at', null);

  const have = new Set((existing ?? []).map((r) => r.name.toLowerCase()));
  const missing = DEFAULT_TAKEOFF_LAYERS.filter(
    (layer) => !have.has(layer.name.toLowerCase())
  );
  if (missing.length === 0) return;

  await supabase.from('takeoff_layers').insert(
    missing.map((layer) => ({
      project_id: projectId,
      name: layer.name,
      color: layer.color,
      sort_order: layer.sort_order,
      is_system: true,
      is_visible: true,
      is_locked: false,
      created_by: userId,
      updated_by: userId,
    }))
  );
}

export async function logTakeoffRevision(input: {
  projectId: string;
  entityType: string;
  entityId?: string | null;
  action: string;
  snapshot?: Record<string, unknown>;
  actorId: string;
}): Promise<void> {
  const supabase = await createClient();
  await supabase.from('takeoff_revision_history').insert({
    project_id: input.projectId,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    action: input.action,
    snapshot: (input.snapshot ?? {}) as Json,
    actor_id: input.actorId,
  });
}
