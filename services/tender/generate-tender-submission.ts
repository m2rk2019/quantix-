'use server';

import { revalidatePath } from 'next/cache';

import { requireUserProfile } from '@/lib/auth/session';
import { ROUTES } from '@/lib/constants/routes';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/services/audit/log-audit-event';
import { buildTenderPackageSnapshot } from '@/services/tender/build-tender-package';
import { buildTenderExcelBuffer } from '@/services/tender/export-tender-excel';
import { buildTenderPdfBuffer } from '@/services/tender/export-tender-pdf';
import { buildTenderZipBuffer } from '@/services/tender/export-tender-zip';
import type { ActionResult } from '@/services/projects/create-project';
import type {
  GenerateTenderSubmissionInput,
  TenderExportType,
  TenderSectionId,
} from '@/types/tender';
import { TENDER_SECTIONS } from '@/types/tender';
import type { Json } from '@/types/database';

function isSection(value: string): value is TenderSectionId {
  return (TENDER_SECTIONS as readonly string[]).includes(value);
}

export interface GenerateTenderResult extends ActionResult {
  tenderSubmissionId?: string;
  version?: number;
  exports?: Array<{
    export_type: TenderExportType;
    filename: string;
    file_size_bytes: number;
  }>;
}

export async function generateTenderSubmission(
  input: GenerateTenderSubmissionInput
): Promise<GenerateTenderResult> {
  let profile;
  try {
    profile = await requireUserProfile();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unauthorized',
    };
  }

  const enabledSections = input.enabledSections.filter(isSection);
  if (enabledSections.length === 0) {
    return { success: false, error: 'Select at least one section.' };
  }

  const exportTypes =
    input.exportTypes.length > 0 ? input.exportTypes : (['pdf', 'excel', 'zip'] as TenderExportType[]);

  try {
    const snapshot = await buildTenderPackageSnapshot({
      projectId: input.projectId,
      enabledSections,
      preparedBy: input.preparedBy,
      checkedBy: input.checkedBy,
      approvedBy: input.approvedBy,
      assumptions: input.assumptions,
      exclusions: input.exclusions,
      commercialNotes: input.commercialNotes,
    });

    const supabase = await createClient();

    await supabase
      .from('project_details')
      .update({
        assumptions:
          input.assumptions?.trim() ||
          String(
            (snapshot.sections.assumptions as { text?: string } | undefined)
              ?.text ?? ''
          ) ||
          null,
        exclusions:
          input.exclusions?.trim() ||
          String(
            (snapshot.sections.exclusions as { text?: string } | undefined)
              ?.text ?? ''
          ) ||
          null,
        commercial_notes:
          input.commercialNotes?.trim() ||
          String(
            (snapshot.sections.commercial_notes as { text?: string } | undefined)
              ?.text ?? ''
          ) ||
          null,
        prepared_by_name: snapshot.branding.prepared_by,
        checked_by_name: snapshot.branding.checked_by,
        approved_by_name: snapshot.branding.approved_by,
        updated_by: profile.id,
      })
      .eq('project_id', input.projectId);

    const { data: latest } = await supabase
      .from('tender_submissions')
      .select('version')
      .eq('project_id', input.projectId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = (latest?.version ?? 0) + 1;
    const title =
      input.title?.trim() ||
      `Tender Package v${nextVersion} — ${snapshot.project.project_code}`;

    const { data: submission, error: insertError } = await supabase
      .from('tender_submissions')
      .insert({
        project_id: input.projectId,
        version: nextVersion,
        title,
        status: 'generated',
        enabled_sections: enabledSections,
        branding: snapshot.branding as unknown as Json,
        package_snapshot: snapshot as unknown as Json,
        prepared_by_name: snapshot.branding.prepared_by,
        checked_by_name: snapshot.branding.checked_by,
        approved_by_name: snapshot.branding.approved_by,
        generated_by: profile.id,
        generated_at: snapshot.generated_at,
      })
      .select('id, version')
      .single();

    if (insertError || !submission) {
      if (
        insertError?.message?.includes('does not exist') ||
        insertError?.message?.includes('schema cache') ||
        insertError?.code === '42P01'
      ) {
        return {
          success: false,
          error:
            'Tender Submission tables are not applied yet. Run supabase/fixes/tender-submission-package.sql',
        };
      }
      return {
        success: false,
        error: insertError?.message ?? 'Failed to store tender submission.',
      };
    }

    const pdfBuffer = exportTypes.includes('pdf') || exportTypes.includes('zip')
      ? await buildTenderPdfBuffer(snapshot)
      : null;
    const excelBuffer =
      exportTypes.includes('excel') || exportTypes.includes('zip')
        ? await buildTenderExcelBuffer(snapshot)
        : null;
    const zipBuffer = exportTypes.includes('zip')
      ? await buildTenderZipBuffer(snapshot, {
          pdf: pdfBuffer ?? undefined,
          excel: excelBuffer ?? undefined,
        })
      : null;

    const code = snapshot.project.project_code.replace(/[^\w.-]+/g, '_');
    const exportRows: Array<{
      tender_submission_id: string;
      export_type: TenderExportType;
      filename: string;
      mime_type: string;
      file_size_bytes: number;
      content_base64: string;
      generated_by: string;
      generated_at: string;
    }> = [];

    if (pdfBuffer && exportTypes.includes('pdf')) {
      exportRows.push({
        tender_submission_id: submission.id,
        export_type: 'pdf',
        filename: `${code}_Tender_v${nextVersion}.pdf`,
        mime_type: 'application/pdf',
        file_size_bytes: pdfBuffer.byteLength,
        content_base64: pdfBuffer.toString('base64'),
        generated_by: profile.id,
        generated_at: snapshot.generated_at,
      });
    }
    if (excelBuffer && exportTypes.includes('excel')) {
      exportRows.push({
        tender_submission_id: submission.id,
        export_type: 'excel',
        filename: `${code}_Tender_v${nextVersion}.xlsx`,
        mime_type:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        file_size_bytes: excelBuffer.byteLength,
        content_base64: excelBuffer.toString('base64'),
        generated_by: profile.id,
        generated_at: snapshot.generated_at,
      });
    }
    if (zipBuffer && exportTypes.includes('zip')) {
      exportRows.push({
        tender_submission_id: submission.id,
        export_type: 'zip',
        filename: `${code}_Tender_v${nextVersion}.zip`,
        mime_type: 'application/zip',
        file_size_bytes: zipBuffer.byteLength,
        content_base64: zipBuffer.toString('base64'),
        generated_by: profile.id,
        generated_at: snapshot.generated_at,
      });
    }

    if (exportRows.length > 0) {
      const { error: exportError } = await supabase
        .from('tender_submission_exports')
        .insert(exportRows);
      if (exportError) {
        return { success: false, error: exportError.message };
      }

      await supabase
        .from('tender_submissions')
        .update({ status: 'exported' })
        .eq('id', submission.id);
    }

    await logAuditEvent({
      projectId: input.projectId,
      entityType: 'tender_submission',
      entityId: submission.id,
      action: 'tender.generated',
      actorId: profile.id,
      module: 'tender',
      remarks: `Tender package v${nextVersion}`,
      payload: {
        version: nextVersion,
        enabled_sections: enabledSections,
        export_types: exportTypes,
        file_sizes: exportRows.map((row) => ({
          export_type: row.export_type,
          file_size_bytes: row.file_size_bytes,
        })),
      },
    });

    revalidatePath(ROUTES.projectTender(input.projectId));
    revalidatePath(ROUTES.projectAudit(input.projectId));

    return {
      success: true,
      projectId: input.projectId,
      tenderSubmissionId: submission.id,
      version: nextVersion,
      exports: exportRows.map((row) => ({
        export_type: row.export_type,
        filename: row.filename,
        file_size_bytes: row.file_size_bytes,
      })),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to generate tender submission.',
    };
  }
}

export async function getLatestTenderSubmissionForProject(
  projectId: string
): Promise<{
  id: string;
  version: number;
  package_snapshot: unknown;
  exports: Array<{
    export_type: string;
    filename: string;
    file_size_bytes: number;
    content_base64: string;
  }>;
} | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tender_submissions')
    .select(
      `
      id,
      version,
      package_snapshot,
      tender_submission_exports (
        export_type,
        filename,
        file_size_bytes,
        content_base64
      )
    `
    )
    .eq('project_id', projectId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const exports = Array.isArray(data.tender_submission_exports)
    ? data.tender_submission_exports
    : data.tender_submission_exports
      ? [data.tender_submission_exports]
      : [];

  return {
    id: data.id,
    version: data.version,
    package_snapshot: data.package_snapshot,
    exports: exports.map((row) => ({
      export_type: row.export_type,
      filename: row.filename,
      file_size_bytes: Number(row.file_size_bytes ?? 0),
      content_base64: row.content_base64,
    })),
  };
}
