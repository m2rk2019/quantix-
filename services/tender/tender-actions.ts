'use server';

import { revalidatePath } from 'next/cache';

import { requireUserProfile } from '@/lib/auth/session';
import { ROUTES } from '@/lib/constants/routes';
import { createClient } from '@/lib/supabase/server';
import { generateTenderSubmission } from '@/services/tender/generate-tender-submission';
import type { ActionResult } from '@/services/projects/create-project';
import type { TenderExportType, TenderSectionId } from '@/types/tender';
import { TENDER_SECTIONS } from '@/types/tender';

function parseSections(formData: FormData): TenderSectionId[] {
  const selected: TenderSectionId[] = [];
  for (const section of TENDER_SECTIONS) {
    if (formData.get(`section_${section}`) === 'on') {
      selected.push(section);
    }
  }
  return selected;
}

function parseExportTypes(formData: FormData): TenderExportType[] {
  const types: TenderExportType[] = [];
  for (const type of ['pdf', 'excel', 'zip'] as const) {
    if (formData.get(`export_${type}`) === 'on') {
      types.push(type);
    }
  }
  return types.length > 0 ? types : ['pdf', 'excel', 'zip'];
}

export async function generateTenderSubmissionAction(
  projectId: string,
  formData: FormData
): Promise<GenerateTenderActionResult> {
  const result = await generateTenderSubmission({
    projectId,
    enabledSections: parseSections(formData),
    exportTypes: parseExportTypes(formData),
    preparedBy: String(formData.get('prepared_by') ?? ''),
    checkedBy: String(formData.get('checked_by') ?? ''),
    approvedBy: String(formData.get('approved_by') ?? ''),
    assumptions: String(formData.get('assumptions') ?? ''),
    exclusions: String(formData.get('exclusions') ?? ''),
    commercialNotes: String(formData.get('commercial_notes') ?? ''),
  });

  return result;
}

export type GenerateTenderActionResult = Awaited<
  ReturnType<typeof generateTenderSubmission>
>;

export async function saveTenderCommercialNotesAction(
  projectId: string,
  formData: FormData
): Promise<ActionResult> {
  const profile = await requireUserProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from('project_details')
    .update({
      assumptions: String(formData.get('assumptions') ?? '').trim() || null,
      exclusions: String(formData.get('exclusions') ?? '').trim() || null,
      commercial_notes:
        String(formData.get('commercial_notes') ?? '').trim() || null,
      prepared_by_name:
        String(formData.get('prepared_by') ?? '').trim() || null,
      checked_by_name: String(formData.get('checked_by') ?? '').trim() || null,
      approved_by_name:
        String(formData.get('approved_by') ?? '').trim() || null,
      updated_by: profile.id,
    })
    .eq('project_id', projectId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(ROUTES.projectTender(projectId));
  return { success: true, projectId };
}
