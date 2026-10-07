import { createClient } from '@/lib/supabase/server';
import { compareTemplateVersions } from '@/lib/master-templates/template-version';
import type { MasterTemplateListItem } from '@/types/master-template';

export async function listMasterTemplates(): Promise<MasterTemplateListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('master_templates')
    .select(
      `
      id,
      template_key,
      template_version,
      display_name,
      description,
      source_project_id,
      created_from_project_id,
      wbs_count,
      boq_count,
      resource_count,
      is_active,
      created_at,
      created_by
    `
    )
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    if (
      error.message.includes('does not exist') ||
      error.message.includes('schema cache') ||
      error.message.includes('template_version') ||
      error.code === '42P01'
    ) {
      // Fallback without versioning columns (pre-migration)
      const { data: legacy, error: legacyError } = await supabase
        .from('master_templates')
        .select(
          `
          id,
          template_key,
          display_name,
          description,
          source_project_id,
          wbs_count,
          boq_count,
          resource_count,
          is_active,
          created_at,
          created_by
        `
        )
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (legacyError) {
        if (
          legacyError.message.includes('does not exist') ||
          legacyError.code === '42P01'
        ) {
          return [];
        }
        throw new Error(legacyError.message);
      }
      return mapRows(
        (legacy ?? []).map((row) => ({
          ...row,
          template_version: '1.0',
          created_from_project_id: row.source_project_id,
        })),
        supabase
      );
    }
    throw new Error(error.message);
  }

  const rows = [...(data ?? [])].sort((a, b) => {
    const keyCmp = String(a.template_key).localeCompare(String(b.template_key));
    if (keyCmp !== 0) return keyCmp;
    return compareTemplateVersions(
      String(b.template_version ?? '1.0'),
      String(a.template_version ?? '1.0')
    );
  });

  return mapRows(rows, supabase);
}

async function mapRows(
  data: Array<{
    id: string;
    template_key: string;
    template_version?: string | null;
    display_name: string;
    description: string | null;
    source_project_id: string | null;
    created_from_project_id?: string | null;
    wbs_count: number | null;
    boq_count: number | null;
    resource_count: number | null;
    is_active: boolean;
    created_at: string;
    created_by: string | null;
  }>,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<MasterTemplateListItem[]> {
  const actorIds = Array.from(
    new Set(data.map((row) => row.created_by).filter(Boolean))
  ) as string[];
  const nameById = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name')
      .in('id', actorIds);
    for (const user of users ?? []) {
      nameById.set(user.id, user.full_name);
    }
  }

  // Mark latest version per family for UI
  const latestByFamily = new Map<string, string>();
  for (const row of data) {
    const ver = String(row.template_version ?? '1.0');
    const prev = latestByFamily.get(row.template_key);
    if (!prev || compareTemplateVersions(ver, prev) > 0) {
      latestByFamily.set(row.template_key, ver);
    }
  }

  return data.map((row) => {
    const version = String(row.template_version ?? '1.0');
    return {
      id: row.id,
      template_key: row.template_key,
      template_version: version,
      display_name: row.display_name,
      description: row.description,
      source_project_id: row.source_project_id,
      created_from_project_id:
        row.created_from_project_id ?? row.source_project_id,
      wbs_count: Number(row.wbs_count ?? 0),
      boq_count: Number(row.boq_count ?? 0),
      resource_count: Number(row.resource_count ?? 0),
      is_active: Boolean(row.is_active),
      is_latest_version: latestByFamily.get(row.template_key) === version,
      created_at: row.created_at,
      created_by_name: row.created_by
        ? (nameById.get(row.created_by) ?? 'Unknown')
        : 'Unknown',
    };
  });
}
