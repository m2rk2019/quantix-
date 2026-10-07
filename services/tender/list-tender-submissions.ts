import { createClient } from '@/lib/supabase/server';
import type {
  TenderExportAuditItem,
  TenderExportType,
  TenderSectionId,
  TenderSubmissionListItem,
} from '@/types/tender';
import { TENDER_SECTIONS } from '@/types/tender';

function asSections(value: unknown): TenderSectionId[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is TenderSectionId =>
    (TENDER_SECTIONS as readonly string[]).includes(String(item))
  );
}

export async function listTenderSubmissions(
  projectId: string
): Promise<TenderSubmissionListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tender_submissions')
    .select(
      `
      id,
      project_id,
      version,
      title,
      status,
      enabled_sections,
      prepared_by_name,
      checked_by_name,
      approved_by_name,
      generated_by,
      generated_at,
      tender_submission_exports (
        id,
        export_type,
        filename,
        file_size_bytes,
        generated_by,
        generated_at
      )
    `
    )
    .eq('project_id', projectId)
    .order('version', { ascending: false });

  if (error) {
    if (
      error.message.includes('does not exist') ||
      error.message.includes('schema cache') ||
      error.code === '42P01'
    ) {
      return [];
    }
    throw new Error(error.message);
  }

  const actorIds = new Set<string>();
  for (const row of data ?? []) {
    if (row.generated_by) actorIds.add(row.generated_by);
    const exports = Array.isArray(row.tender_submission_exports)
      ? row.tender_submission_exports
      : [];
    for (const item of exports) {
      if (item.generated_by) actorIds.add(item.generated_by);
    }
  }

  const nameById = new Map<string, string>();
  if (actorIds.size > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name')
      .in('id', Array.from(actorIds));
    for (const user of users ?? []) {
      nameById.set(user.id, user.full_name);
    }
  }

  return (data ?? []).map((row) => {
    const exportsRaw = Array.isArray(row.tender_submission_exports)
      ? row.tender_submission_exports
      : [];

    const exports: TenderExportAuditItem[] = exportsRaw.map((item) => ({
      id: item.id,
      export_type: item.export_type as TenderExportType,
      filename: item.filename,
      file_size_bytes: Number(item.file_size_bytes ?? 0),
      generated_by: item.generated_by,
      generated_by_name: item.generated_by
        ? (nameById.get(item.generated_by) ?? 'Unknown')
        : row.generated_by
          ? (nameById.get(row.generated_by) ?? 'Unknown')
          : 'Unknown',
      generated_at: item.generated_at,
    }));

    return {
      id: row.id,
      project_id: row.project_id,
      version: row.version,
      title: row.title,
      status: row.status,
      enabled_sections: asSections(row.enabled_sections),
      prepared_by_name: row.prepared_by_name,
      checked_by_name: row.checked_by_name,
      approved_by_name: row.approved_by_name,
      generated_by: row.generated_by,
      generated_by_name: row.generated_by
        ? (nameById.get(row.generated_by) ?? 'Unknown')
        : 'Unknown',
      generated_at: row.generated_at,
      exports,
    };
  });
}

export async function getTenderExportFile(input: {
  projectId: string;
  tenderSubmissionId: string;
  exportType: TenderExportType;
}): Promise<{
  filename: string;
  mime_type: string;
  content: Buffer;
  version: number;
} | null> {
  const supabase = await createClient();

  const { data: submission } = await supabase
    .from('tender_submissions')
    .select('id, version, project_id')
    .eq('id', input.tenderSubmissionId)
    .eq('project_id', input.projectId)
    .maybeSingle();

  if (!submission) {
    return null;
  }

  const { data: file } = await supabase
    .from('tender_submission_exports')
    .select('filename, mime_type, content_base64')
    .eq('tender_submission_id', submission.id)
    .eq('export_type', input.exportType)
    .maybeSingle();

  if (!file?.content_base64) {
    return null;
  }

  return {
    filename: file.filename,
    mime_type: file.mime_type,
    content: Buffer.from(file.content_base64, 'base64'),
    version: submission.version,
  };
}
