import {
  UAT_MODULE_LABELS,
  type UatAutomatedCheck,
  type UatModuleId,
  type UatScenario,
} from '@/types/uat';

export const UAT_SCENARIOS: UatScenario[] = [
  // Authentication
  { id: 'UAT-LOGIN-001', module: 'authentication', title: 'Successful login', steps: 'Open /login. Enter valid credentials. Submit.', expected: 'Redirect to /dashboard. Session persists.' },
  { id: 'UAT-LOGIN-002', module: 'authentication', title: 'Invalid credentials', steps: 'Enter wrong password. Submit.', expected: 'Error shown. User remains on login page.' },
  { id: 'UAT-LOGIN-003', module: 'authentication', title: 'Protected route redirect', steps: 'Log out. Navigate to /projects.', expected: 'Redirect to /login.' },
  { id: 'UAT-LOGIN-004', module: 'authentication', title: 'Logout', steps: 'Open user menu. Log out.', expected: 'Session cleared. /dashboard requires login.' },
  { id: 'UAT-LOGIN-005', module: 'authentication', title: 'Inactive account', steps: 'Attempt login with deactivated user.', expected: 'Login denied with appropriate error.' },
  { id: 'UAT-LOGIN-006', module: 'authentication', title: 'Session persistence', steps: 'Login. Refresh browser.', expected: 'User remains authenticated.' },

  // Company Settings
  { id: 'UAT-SET-001', module: 'company_settings', title: 'Admin access', steps: 'Login as Admin. Open /admin/settings.', expected: 'Settings page loads. Non-admin redirected.', verifyScript: 'verify:company-settings' },
  { id: 'UAT-SET-002', module: 'company_settings', title: 'Company profile', steps: 'Edit company name, address, phone. Save.', expected: 'Changes persist after refresh.' },
  { id: 'UAT-SET-003', module: 'company_settings', title: 'Default percentages', steps: 'Set default OCM, contingency, profit, VAT. Save.', expected: 'Defaults saved and shown on new projects.' },
  { id: 'UAT-SET-004', module: 'company_settings', title: 'Branding theme', steps: 'Change theme color. Save.', expected: 'Theme applied to exports and dashboard.' },
  { id: 'UAT-SET-005', module: 'company_settings', title: 'Report header/footer', steps: 'Edit report header and footer. Save.', expected: 'Text appears on Excel exports.' },
  { id: 'UAT-SET-006', module: 'company_settings', title: 'Viewer blocked', steps: 'Login as Viewer. Navigate to /admin/settings.', expected: 'Redirect to /unauthorized.' },

  // Projects
  { id: 'UAT-PROJ-001', module: 'projects', title: 'List display', steps: 'Open /projects.', expected: 'Table shows accessible projects with code, name, client, status.' },
  { id: 'UAT-PROJ-002', module: 'projects', title: 'Search', steps: 'Enter partial project name or code.', expected: 'List filters to matching projects.' },
  { id: 'UAT-PROJ-003', module: 'projects', title: 'Status filter', steps: 'Filter by status.', expected: 'Only matching projects shown.' },
  { id: 'UAT-PROJ-004', module: 'projects', title: 'Create project', steps: 'Login as Estimator. Create project with required fields.', expected: 'Project created with QTX-YYYY-###### code.', verifyScript: 'verify:create-project' },
  { id: 'UAT-PROJ-005', module: 'projects', title: 'Permissions matrix', steps: 'For each role, attempt create/edit/delete.', expected: 'Outcomes match authorization matrix.', verifyScript: 'verify:projects' },
  { id: 'UAT-PROJ-006', module: 'projects', title: 'Lifecycle transitions', steps: 'Draft → In Progress → For Review → Approved.', expected: 'Status changes with audit events.' },
  { id: 'UAT-PROJ-007', module: 'projects', title: 'Estimate settings', steps: 'Edit percentages on project details. Save.', expected: 'Summary recalculates with new percentages.' },
  { id: 'UAT-PROJ-008', module: 'projects', title: 'Soft delete', steps: 'Delete Draft project.', expected: 'Project removed from list.' },

  // WBS
  { id: 'UAT-WBS-001', module: 'wbs', title: 'Tree display', steps: 'Open WBS tab.', expected: 'Hierarchical tree with codes and descriptions.' },
  { id: 'UAT-WBS-002', module: 'wbs', title: 'Add root node', steps: 'Add WBS node at root.', expected: 'Node appears in tree.' },
  { id: 'UAT-WBS-003', module: 'wbs', title: 'Add child node', steps: 'Select parent. Add child.', expected: 'Child nested under parent.' },
  { id: 'UAT-WBS-004', module: 'wbs', title: 'Edit node', steps: 'Edit description. Save.', expected: 'Changes persist. Audit logged.' },
  { id: 'UAT-WBS-005', module: 'wbs', title: 'Delete node', steps: 'Delete leaf node.', expected: 'Leaf deletes when allowed.' },
  { id: 'UAT-WBS-006', module: 'wbs', title: 'Search', steps: 'Search by code or description.', expected: 'Tree filters or highlights matches.' },
  { id: 'UAT-WBS-007', module: 'wbs', title: 'Viewer read-only', steps: 'Login as Viewer. Open WBS.', expected: 'No add/edit/delete controls.' },
  { id: 'UAT-WBS-008', module: 'wbs', title: 'Large tree', steps: 'Open project with 100+ WBS nodes.', expected: 'Tree remains responsive.' },

  // BOQ
  { id: 'UAT-BOQ-001', module: 'boq', title: 'Grid display', steps: 'Open BOQ tab.', expected: 'All rate columns, total rate, total amount visible.' },
  { id: 'UAT-BOQ-002', module: 'boq', title: 'Add line item', steps: 'Add BOQ row with qty and rates.', expected: 'Total rate = sum of five rates. Amount = qty × rate.', verifyScript: 'verify:estimating-engine' },
  { id: 'UAT-BOQ-003', module: 'boq', title: 'Inline edit', steps: 'Change quantity. Save.', expected: 'Total amount recalculates immediately.' },
  { id: 'UAT-BOQ-004', module: 'boq', title: 'Rate calculation', steps: 'Set material=100, labor=50, equipment=25, subcontract=10, other=5.', expected: 'Total rate = 190.00. Qty 10 → 1,900.00.' },
  { id: 'UAT-BOQ-005', module: 'boq', title: 'WBS filter', steps: 'Filter BOQ by WBS node.', expected: 'Only matching items shown.' },
  { id: 'UAT-BOQ-006', module: 'boq', title: 'Search', steps: 'Search by item code or description.', expected: 'Matching rows displayed.' },
  { id: 'UAT-BOQ-007', module: 'boq', title: 'Pagination', steps: 'Scroll project with 200+ lines.', expected: 'Additional pages load without duplicates.' },
  { id: 'UAT-BOQ-008', module: 'boq', title: 'Delete item', steps: 'Delete a BOQ line.', expected: 'Row removed. Direct cost decreases.' },
  { id: 'UAT-BOQ-009', module: 'boq', title: 'Viewer read-only', steps: 'Login as Viewer. Open BOQ.', expected: 'No inline edit, add, or delete.' },
  { id: 'UAT-BOQ-010', module: 'boq', title: 'Large BOQ benchmark', steps: 'Open project with 1000+ BOQ lines.', expected: 'Grid loads within performance threshold.' },

  // Rate Library
  { id: 'UAT-RL-001', module: 'rate_library', title: 'Browse materials', steps: 'Open /admin/resource-library/materials.', expected: 'Materials list with code, description, unit, rate.' },
  { id: 'UAT-RL-002', module: 'rate_library', title: 'Add material', steps: 'Login as Admin. Add new material.', expected: 'Resource saved and searchable.' },
  { id: 'UAT-RL-003', module: 'rate_library', title: 'Edit labor rate', steps: 'Update labor resource rate. Save.', expected: 'Rate updated. Audit logged.' },
  { id: 'UAT-RL-004', module: 'rate_library', title: 'Equipment catalog', steps: 'Open equipment tab.', expected: 'Equipment resources listed.' },
  { id: 'UAT-RL-005', module: 'rate_library', title: 'Subcontract catalog', steps: 'Open subcontract tab.', expected: 'Subcontract resources listed.' },
  { id: 'UAT-RL-006', module: 'rate_library', title: 'Viewer browse only', steps: 'Login as Viewer. Browse library.', expected: 'Read-only. No create/edit/delete.' },
  { id: 'UAT-RL-007', module: 'rate_library', title: 'Export library', steps: 'Export resource library to Excel.', expected: 'Workbook downloads with all categories.' },

  // Rate Analysis
  { id: 'UAT-RA-001', module: 'rate_analysis', title: 'Open rate analysis', steps: 'Open Rates tab on BOQ item.', expected: 'Rate analysis panel with resource lines.' },
  { id: 'UAT-RA-002', module: 'rate_analysis', title: 'Add resource line', steps: 'Add material from library.', expected: 'Line amount = qty × consumption × rate.' },
  { id: 'UAT-RA-003', module: 'rate_analysis', title: 'Category totals', steps: 'Review material/labor/equipment totals.', expected: 'Totals match BOQ rate columns.', verifyScript: 'verify:rate-analysis' },
  { id: 'UAT-RA-004', module: 'rate_analysis', title: 'Library sync', steps: 'Update library rate. Sync BOQ item.', expected: 'BOQ rates update from analysis lines.' },
  { id: 'UAT-RA-005', module: 'rate_analysis', title: 'Manual override', steps: 'Override material rate on BOQ.', expected: 'Override flag set. Analysis preserved.' },
  { id: 'UAT-RA-006', module: 'rate_analysis', title: 'Duplicate detection', steps: 'Add duplicate resource on same line.', expected: 'Validation warning or block.' },

  // Estimate Summary
  { id: 'UAT-SUM-001', module: 'estimate_summary', title: 'Summary display', steps: 'Open Estimate Summary tab.', expected: 'Direct, OCM, Contingency, Profit, VAT, Grand Total shown.' },
  { id: 'UAT-SUM-002', module: 'estimate_summary', title: 'Direct cost accuracy', steps: 'Compare direct cost to BOQ sum.', expected: 'Direct cost equals sum of BOQ total_amount.' },
  { id: 'UAT-SUM-003', module: 'estimate_summary', title: 'Overhead chain', steps: 'Set known percentages. Refresh summary.', expected: 'OCM, contingency, profit, VAT chain correct.' },
  { id: 'UAT-SUM-004', module: 'estimate_summary', title: 'WBS rollup', steps: 'Review WBS rollup panel.', expected: 'Hierarchy matches WBS tab totals.' },
  { id: 'UAT-SUM-005', module: 'estimate_summary', title: 'Refresh', steps: 'Change BOQ. Click Refresh.', expected: 'Totals update to reflect changes.' },
  { id: 'UAT-SUM-006', module: 'estimate_summary', title: 'Approved read-only', steps: 'Open Approved project.', expected: 'Summary displays. Edit disabled elsewhere.' },

  // AI Estimator
  { id: 'UAT-AI-001', module: 'ai_estimator', title: 'Page access', steps: 'Login as Estimator. Open AI Estimator tab.', expected: 'Copilot panel loads.', verifyScript: 'verify:ai-engineering' },
  { id: 'UAT-AI-002', module: 'ai_estimator', title: 'Quantity suggestion', steps: 'Request concrete volume for slab.', expected: 'Formula-based quantity returned with explanation.' },
  { id: 'UAT-AI-003', module: 'ai_estimator', title: 'Apply to BOQ', steps: 'Accept suggested quantity on BOQ line.', expected: 'Quantity updated on BOQ item.' },
  { id: 'UAT-AI-004', module: 'ai_estimator', title: 'Viewer blocked', steps: 'Login as Viewer. Open AI Estimator.', expected: 'Access denied or read-only per policy.' },
  { id: 'UAT-AI-005', module: 'ai_estimator', title: 'Engineering modules', steps: 'Browse available engineering modules.', expected: '10 modules listed with quantity types.' },

  // Executive Dashboard
  { id: 'UAT-EXEC-001', module: 'executive_dashboard', title: 'Dashboard load', steps: 'Login as Admin. Open /dashboard.', expected: 'KPI cards and charts load.', verifyScript: 'verify:executive-dashboard' },
  { id: 'UAT-EXEC-002', module: 'executive_dashboard', title: 'Project status buckets', steps: 'Review status distribution.', expected: 'Six status buckets displayed correctly.' },
  { id: 'UAT-EXEC-003', module: 'executive_dashboard', title: 'Cost breakdown', steps: 'Review cost category chart.', expected: 'Eight categories with totals.' },
  { id: 'UAT-EXEC-004', module: 'executive_dashboard', title: 'Executive export', steps: 'Export executive report to Excel.', expected: 'Workbook downloads with KPI sheets.' },
  { id: 'UAT-EXEC-005', module: 'executive_dashboard', title: 'Print view', steps: 'Open /dashboard/print.', expected: 'Print-optimized layout renders.' },

  // Historical Benchmark
  { id: 'UAT-BENCH-001', module: 'historical_benchmark', title: 'Benchmark hub', steps: 'Open /admin/benchmarks.', expected: 'Accuracy dashboard loads.', verifyScript: 'verify:historical-benchmarks' },
  { id: 'UAT-BENCH-002', module: 'historical_benchmark', title: 'Validation center', steps: 'Select benchmark project. View validation.', expected: 'Estimated vs actual comparison with variance.' },
  { id: 'UAT-BENCH-003', module: 'historical_benchmark', title: 'Formula audit', steps: 'Open Formula Audit tab.', expected: 'Per-item formula breakdown with drill-down.' },
  { id: 'UAT-BENCH-004', module: 'historical_benchmark', title: 'Data import', steps: 'Import CSV benchmark bundle.', expected: 'Project, WBS, BOQ, actuals created.' },
  { id: 'UAT-BENCH-005', module: 'historical_benchmark', title: 'Acceptance criteria', steps: 'Review accuracy dashboard.', expected: '≥95% qty/rate, ≥97% formula, 100% consistency.' },
  { id: 'UAT-BENCH-006', module: 'historical_benchmark', title: 'Benchmark reports', steps: 'Export validation and lessons learned reports.', expected: 'Excel reports download.' },

  // Excel Export
  { id: 'UAT-EXP-001', module: 'excel_export', title: 'Permission gate', steps: 'Login as Viewer. Open Summary.', expected: 'Export button hidden.' },
  { id: 'UAT-EXP-002', module: 'excel_export', title: 'Validation gate', steps: 'Leave validation errors. Attempt export.', expected: 'Export disabled with reason.' },
  { id: 'UAT-EXP-003', module: 'excel_export', title: 'Successful export', steps: 'Fix validation. Export to Excel.', expected: '.xlsx downloads with all sheets.' },
  { id: 'UAT-EXP-004', module: 'excel_export', title: 'Summary sheet totals', steps: 'Compare Sheet 2 to on-screen summary.', expected: 'Direct, OCM, VAT, Grand Total match.' },
  { id: 'UAT-EXP-005', module: 'excel_export', title: 'BOQ sheet data', steps: 'Compare Sheet 4 to BOQ grid.', expected: 'All columns and rows match.' },
  { id: 'UAT-EXP-006', module: 'excel_export', title: 'Large project export', steps: 'Export 1000+ line project.', expected: 'Export completes within threshold.' },
  { id: 'UAT-EXP-007', module: 'excel_export', title: 'Audit on export', steps: 'Check audit after export.', expected: 'project.exported event logged.' },

  // PDF Export (print)
  { id: 'UAT-PDF-001', module: 'pdf_export', title: 'Estimate print view', steps: 'Open /projects/[id]/summary/print.', expected: 'Print-optimized estimate summary renders.' },
  { id: 'UAT-PDF-002', module: 'pdf_export', title: 'Auto-print', steps: 'Open print URL with ?autoprint=1.', expected: 'Browser print dialog opens.' },
  { id: 'UAT-PDF-003', module: 'pdf_export', title: 'Print totals match', steps: 'Compare print view to summary tab.', expected: 'All totals and percentages match.' },
  { id: 'UAT-PDF-004', module: 'pdf_export', title: 'Executive print', steps: 'Open /dashboard/print.', expected: 'Executive KPI print layout renders.' },
  { id: 'UAT-PDF-005', module: 'pdf_export', title: 'Company branding', steps: 'Print with custom company settings.', expected: 'Company name and header appear on print.' },

  // Validation
  { id: 'UAT-VAL-001', module: 'validation', title: 'Panel display', steps: 'Open Validation on Summary or /validation.', expected: 'Score and categorized checks visible.' },
  { id: 'UAT-VAL-002', module: 'validation', title: 'All checks pass', steps: 'Use complete UAT project.', expected: 'All 12 checks pass.' },
  { id: 'UAT-VAL-003', module: 'validation', title: 'Export gate', steps: 'With errors present, check Export.', expected: 'Export disabled with tooltip reason.' },
  { id: 'UAT-VAL-004', module: 'validation', title: 'Go-to links', steps: 'Click Go to on failing check.', expected: 'Navigates to correct module.' },

  // Audit Trail
  { id: 'UAT-AUD-001', module: 'audit_trail', title: 'Page access', steps: 'Open Audit History tab.', expected: 'Chronological event list.' },
  { id: 'UAT-AUD-002', module: 'audit_trail', title: 'BOQ change logged', steps: 'Edit BOQ. Check audit.', expected: 'BOQ update event recorded.' },
  { id: 'UAT-AUD-003', module: 'audit_trail', title: 'Lifecycle event', steps: 'Approve project. Check audit.', expected: 'Status transition logged.' },
  { id: 'UAT-AUD-004', module: 'audit_trail', title: 'Append-only', steps: 'Confirm no delete on audit entries.', expected: 'Audit log is read-only.' },

  // Cross-cutting
  { id: 'UAT-X-001', module: 'cross_cutting', title: 'Role matrix smoke', steps: 'For each role, test create/edit/export/approve.', expected: 'Matches authorization matrix.' },
  { id: 'UAT-X-002', module: 'cross_cutting', title: 'Responsive tablet', steps: 'Set viewport 768px. Navigate app.', expected: 'Layout usable with horizontal scroll on tables.' },
  { id: 'UAT-X-003', module: 'cross_cutting', title: 'End-to-end happy path', steps: 'Create → WBS → BOQ → Summary → Validate → Export.', expected: 'Complete workflow without errors.' },
  { id: 'UAT-X-004', module: 'cross_cutting', title: 'Formula verification', steps: 'Run UAT Formula Verification page.', expected: '100% pass on demo project.', verifyScript: 'verify:estimating-engine' },
  { id: 'UAT-X-005', module: 'cross_cutting', title: 'Performance suite', steps: 'Run UAT Performance Test page.', expected: 'All metrics under threshold.', verifyScript: 'verify:uat-suite' },
];

export const UAT_AUTOMATED_CHECKS: UatAutomatedCheck[] = [
  { id: 'auto-estimating', label: 'Estimating Engine', npmScript: 'verify:estimating-engine', module: 'boq', description: 'Formula accuracy, snapshot validation, performance benchmarks' },
  { id: 'auto-rate-analysis', label: 'Rate Analysis', npmScript: 'verify:rate-analysis', module: 'rate_analysis', description: 'Rate build-up and category total formulas' },
  { id: 'auto-ai', label: 'AI Engineering', npmScript: 'verify:ai-engineering', module: 'ai_estimator', description: 'Engineering modules and quantity formulas' },
  { id: 'auto-dashboard', label: 'Executive Dashboard', npmScript: 'verify:executive-dashboard', module: 'executive_dashboard', description: 'KPI buckets and report types' },
  { id: 'auto-settings', label: 'Company Settings', npmScript: 'verify:company-settings', module: 'company_settings', description: 'Migration fields and performance indexes' },
  { id: 'auto-benchmark', label: 'Historical Benchmark', npmScript: 'verify:historical-benchmarks', module: 'historical_benchmark', description: 'Five archetype projects, 95%+ accuracy' },
  { id: 'auto-projects', label: 'Projects & Permissions', npmScript: 'verify:projects', module: 'projects', description: 'RLS and role-based access (requires Supabase)' },
  { id: 'auto-create', label: 'Create Project', npmScript: 'verify:create-project', module: 'projects', description: 'Project creation flow (requires Supabase)' },
  { id: 'auto-rc', label: 'Release Candidate', npmScript: 'rc:verify', module: 'cross_cutting', description: 'Inline calc and permission matrix' },
];

export function getUatChecklistSummary(): {
  total_scenarios: number;
  modules: Array<{ module: UatModuleId; label: string; scenario_count: number }>;
} {
  const counts = new Map<UatModuleId, number>();
  for (const scenario of UAT_SCENARIOS) {
    counts.set(scenario.module, (counts.get(scenario.module) ?? 0) + 1);
  }

  return {
    total_scenarios: UAT_SCENARIOS.length,
    modules: (Object.keys(UAT_MODULE_LABELS) as UatModuleId[])
      .filter((module) => counts.has(module))
      .map((module) => ({
        module,
        label: UAT_MODULE_LABELS[module],
        scenario_count: counts.get(module) ?? 0,
      })),
  };
}
