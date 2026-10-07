import JSZip from 'jszip';

import { buildTenderExcelBuffer } from '@/services/tender/export-tender-excel';
import { buildTenderPdfBuffer } from '@/services/tender/export-tender-pdf';
import type { TenderPackageSnapshot } from '@/types/tender';
import { TENDER_SECTION_LABELS } from '@/types/tender';

export async function buildTenderZipBuffer(
  snapshot: TenderPackageSnapshot,
  options?: { pdf?: Buffer; excel?: Buffer }
): Promise<Buffer> {
  const zip = new JSZip();
  const code = snapshot.project.project_code.replace(/[^\w.-]+/g, '_');
  const folder = zip.folder(`Tender_${code}`) ?? zip;

  const pdf = options?.pdf ?? (await buildTenderPdfBuffer(snapshot));
  const excel = options?.excel ?? (await buildTenderExcelBuffer(snapshot));

  folder.file(`${code}_Tender_Package.pdf`, pdf);
  folder.file(`${code}_Tender_Package.xlsx`, excel);

  const manifest = {
    project_code: snapshot.project.project_code,
    project_name: snapshot.project.project_name,
    generated_at: snapshot.generated_at,
    enabled_sections: snapshot.enabled_sections.map((id) => ({
      id,
      label: TENDER_SECTION_LABELS[id],
    })),
    branding: {
      company_name: snapshot.branding.company_name,
      prepared_by: snapshot.branding.prepared_by,
      checked_by: snapshot.branding.checked_by,
      approved_by: snapshot.branding.approved_by,
    },
  };
  folder.file('manifest.json', JSON.stringify(manifest, null, 2));

  // Individual section JSON documents for reproducibility / HCI later
  const sectionsFolder = folder.folder('sections');
  for (const sectionId of snapshot.enabled_sections) {
    const payload = snapshot.sections[sectionId];
    if (!payload) continue;
    sectionsFolder?.file(
      `${sectionId}.json`,
      JSON.stringify(payload, null, 2)
    );
  }

  const content = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });
  return Buffer.from(content);
}
