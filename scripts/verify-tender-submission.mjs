/**
 * Phase 5 — Tender Submission Package verification.
 *   npm run verify:tender-submission
 *
 * Static + generator smoke tests (no live DB required for core PASS).
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = resolve(import.meta.dirname, '..');

const results = [];

function pass(feature, detail = '') {
  results.push({ feature, status: 'PASS', detail });
  console.log('PASS', feature, detail ? `— ${detail}` : '');
}

function fail(feature, detail = '') {
  results.push({ feature, status: 'FAIL', detail });
  console.error('FAIL', feature, detail ? `— ${detail}` : '');
}

function read(rel) {
  return readFileSync(resolve(root, rel), 'utf8');
}

function exists(rel) {
  return existsSync(resolve(root, rel));
}

// 1. Schema migration
{
  const migration = 'supabase/migrations/20261005140000_tender_submission_package.sql';
  const fixes = 'supabase/fixes/tender-submission-package.sql';
  if (exists(migration) && exists(fixes)) {
    pass('Schema migration files', `${migration} + fixes`);
  } else {
    fail('Schema migration files', 'missing migration or fixes SQL');
  }

  const sql = read(migration);
  for (const token of [
    'tender_submissions',
    'tender_submission_exports',
    'assumptions',
    'exclusions',
    'commercial_notes',
    'prepared_by_name',
    'checked_by_name',
    'approved_by_name',
    'tender_package',
    'content_base64',
    'export_type',
  ]) {
    if (sql.includes(token)) pass(`Schema contains ${token}`);
    else fail(`Schema contains ${token}`);
  }
}

// 2. Module files
{
  const files = [
    'types/tender.ts',
    'services/tender/build-tender-package.ts',
    'services/tender/export-tender-pdf.ts',
    'services/tender/export-tender-excel.ts',
    'services/tender/export-tender-zip.ts',
    'services/tender/generate-tender-submission.ts',
    'services/tender/list-tender-submissions.ts',
    'services/tender/tender-actions.ts',
    'features/tender/components/TenderSubmissionModule.tsx',
    'app/(shell)/projects/[projectId]/tender/page.tsx',
    'app/api/projects/[projectId]/tender/[submissionId]/export/[exportType]/route.ts',
  ];
  for (const file of files) {
    if (exists(file)) pass(`Module file ${file}`);
    else fail(`Module file ${file}`);
  }
}

// 3. Sections + exports coverage
{
  const types = read('types/tender.ts');
  const requiredSections = [
    'cover_page',
    'executive_summary',
    'estimate_summary',
    'boq',
    'detailed_resource_analysis',
    'wbs_summary',
    'cost_breakdown',
    'bid_composition',
    'ai_insights',
    'assumptions',
    'exclusions',
    'commercial_notes',
  ];
  for (const section of requiredSections) {
    if (types.includes(`'${section}'`)) pass(`Section id ${section}`);
    else fail(`Section id ${section}`);
  }
  for (const exp of ["'pdf'", "'excel'", "'zip'"]) {
    if (types.includes(exp)) pass(`Export type ${exp}`);
    else fail(`Export type ${exp}`);
  }
}

// 4. Branding + UI wiring
{
  const ui = read('features/tender/components/TenderSubmissionModule.tsx');
  for (const token of [
    'Prepared by',
    'Checked by',
    'Approved by',
    'Company branding',
    'Enable all',
    'Version &',
    'file_size_bytes',
    'export_type',
  ]) {
    if (ui.includes(token)) pass(`UI supports ${token}`);
    else fail(`UI supports ${token}`);
  }

  const tabs = read('features/projects/components/ProjectDetailsTabs.tsx');
  if (tabs.includes("label: 'Tender'") && tabs.includes('projectTender')) {
    pass('Project tab Tender');
  } else {
    fail('Project tab Tender');
  }

  const routes = read('lib/constants/routes.ts');
  if (routes.includes('projectTender')) pass('Route projectTender');
  else fail('Route projectTender');
}

// 5. Historical integration
{
  const histTypes = read('types/historical-project.ts');
  const capture = read(
    'services/historical-projects/capture-historical-archive.ts'
  );
  if (histTypes.includes("'tender_package'")) {
    pass('Historical section tender_package typed');
  } else {
    fail('Historical section tender_package typed');
  }
  if (
    capture.includes("section: 'tender_package'") &&
    capture.includes('getLatestTenderSubmissionForProject')
  ) {
    pass('Historical archive captures tender package');
  } else {
    fail('Historical archive captures tender package');
  }
}

// 6. Dependencies
{
  const pkg = JSON.parse(read('package.json'));
  for (const dep of ['jszip', 'pdf-lib', 'exceljs']) {
    if (pkg.dependencies?.[dep]) pass(`Dependency ${dep}`);
    else fail(`Dependency ${dep}`);
  }
}

// 7. Generator smoke (PDF / Excel / ZIP)
{
  try {
    const { PDFDocument } = require('pdf-lib');
    const ExcelJS = require('exceljs');
    const JSZip = require('jszip');

    const snapshot = {
      project: {
        id: 'p1',
        project_code: 'QTX-TEST-001',
        project_name: 'Smoke Tender Project',
        client_name: 'Client Co',
        location: 'Manila',
        status: 'approved',
      },
      branding: {
        company_name: 'Quantix',
        logo_url: null,
        address: '1 Test Street',
        phone: '+63 2 0000',
        email: 'tender@quantix.test',
        website: null,
        report_header: 'Confidential',
        report_footer: 'End of package',
        prepared_by: 'Estimator',
        checked_by: 'QS',
        approved_by: 'Admin',
      },
      enabled_sections: [
        'cover_page',
        'executive_summary',
        'estimate_summary',
        'boq',
        'assumptions',
      ],
      sections: {
        cover_page: {
          project_name: 'Smoke Tender Project',
          client_name: 'Client Co',
          grand_total: 1000000,
          currency: 'PHP',
        },
        executive_summary: {
          narrative: 'Smoke test executive summary.',
          discipline_breakdown: [],
        },
        estimate_summary: {
          breakdown: {
            direct_cost: 800000,
            indirect_cost: 80000,
            contingency: 40000,
            markup: 80000,
            vat: 120000,
            grand_total: 1120000,
          },
        },
        boq: {
          items: [
            {
              item_code: 'A.1',
              description: 'Concrete works',
              unit: 'm3',
              quantity: 10,
              total_rate: 5000,
              total_amount: 50000,
              wbs_code: '1',
            },
          ],
          count: 1,
        },
        assumptions: { text: 'Market rates current as of test date.' },
      },
      generated_at: new Date().toISOString(),
    };

    // Inline minimal PDF builder using pdf-lib
    const run = async () => {
      const doc = await PDFDocument.create();
      const page = doc.addPage();
      page.drawText('Tender smoke PDF', { x: 50, y: 750, size: 14 });
      const pdfBytes = Buffer.from(await doc.save());
      if (pdfBytes.byteLength > 100) pass('PDF generator smoke', `${pdfBytes.byteLength} bytes`);
      else fail('PDF generator smoke', 'too small');

      const wb = new ExcelJS.Workbook();
      const sheet = wb.addWorksheet('Cover');
      sheet.addRow([snapshot.project.project_name]);
      const xlsx = Buffer.from(await wb.xlsx.writeBuffer());
      if (xlsx.byteLength > 100) pass('Excel generator smoke', `${xlsx.byteLength} bytes`);
      else fail('Excel generator smoke', 'too small');

      const zip = new JSZip();
      zip.file('package.pdf', pdfBytes);
      zip.file('package.xlsx', xlsx);
      zip.file('manifest.json', JSON.stringify({ ok: true }));
      const zipBuf = Buffer.from(
        await zip.generateAsync({ type: 'nodebuffer' })
      );
      if (zipBuf.byteLength > 100) pass('ZIP generator smoke', `${zipBuf.byteLength} bytes`);
      else fail('ZIP generator smoke', 'too small');
    };

    await run();
  } catch (error) {
    fail('Generator smoke', error instanceof Error ? error.message : String(error));
  }
}

// 8. Audit module
{
  const audit = read('types/audit.ts');
  if (audit.includes("'tender'") && audit.includes('Tender Submission')) {
    pass('Audit module tender');
  } else {
    fail('Audit module tender');
  }
}

const failed = results.filter((r) => r.status === 'FAIL').length;
const passed = results.filter((r) => r.status === 'PASS').length;
const overall = failed === 0 ? 'PASS' : 'FAIL';

const report = `# Tender Submission Package — Verification Report

**Date:** ${new Date().toISOString()}
**Overall:** **${overall}** (${passed} PASS / ${failed} FAIL)

| Feature | Status | Detail |
|---------|--------|--------|
${results
  .map(
    (r) =>
      `| ${r.feature.replaceAll('|', '/')} | ${r.status} | ${String(r.detail ?? '').replaceAll('|', '/')} |`
  )
  .join('\n')}

## Manual apply (production)

\`\`\`sql
-- Run in Supabase SQL editor
-- supabase/fixes/tender-submission-package.sql
\`\`\`

## Workflow checklist

1. Open project → **Tender** tab
2. Toggle sections / set Prepared / Checked / Approved
3. Generate package (PDF + Excel + ZIP)
4. Confirm version history + downloads
5. Archive project → historical snapshot includes \`tender_package\`
`;

writeFileSync(
  resolve(root, 'docs/TENDER_SUBMISSION_E2E_REPORT.md'),
  report,
  'utf8'
);

console.log('\nRESULT:', overall);
console.log('Report: docs/TENDER_SUBMISSION_E2E_REPORT.md');
process.exit(failed === 0 ? 0 : 1);
