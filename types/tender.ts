/**
 * Phase 5 — Tender Submission Package types.
 */

export const TENDER_SECTIONS = [
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
] as const;

export type TenderSectionId = (typeof TENDER_SECTIONS)[number];

export const TENDER_SECTION_LABELS: Record<TenderSectionId, string> = {
  cover_page: 'Cover Page',
  executive_summary: 'Executive Summary',
  estimate_summary: 'Estimate Summary',
  boq: 'BOQ',
  detailed_resource_analysis: 'Detailed Resource Analysis',
  wbs_summary: 'WBS Summary',
  cost_breakdown: 'Cost Breakdown',
  bid_composition: 'Bid Composition',
  ai_insights: 'AI Insights',
  assumptions: 'Assumptions',
  exclusions: 'Exclusions',
  commercial_notes: 'Commercial Notes',
};

export const DEFAULT_ENABLED_TENDER_SECTIONS: TenderSectionId[] = [
  ...TENDER_SECTIONS,
];

export type TenderExportType = 'pdf' | 'excel' | 'zip';

export interface TenderBrandingConfig {
  company_name: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  report_header: string | null;
  report_footer: string | null;
  prepared_by: string;
  checked_by: string;
  approved_by: string;
}

export interface TenderSectionToggle {
  id: TenderSectionId;
  label: string;
  enabled: boolean;
}

export interface TenderSubmissionListItem {
  id: string;
  project_id: string;
  version: number;
  title: string;
  status: string;
  enabled_sections: TenderSectionId[];
  prepared_by_name: string | null;
  checked_by_name: string | null;
  approved_by_name: string | null;
  generated_by: string | null;
  generated_by_name: string;
  generated_at: string;
  exports: TenderExportAuditItem[];
}

export interface TenderExportAuditItem {
  id: string;
  export_type: TenderExportType;
  filename: string;
  file_size_bytes: number;
  generated_by: string | null;
  generated_by_name: string;
  generated_at: string;
}

export interface GenerateTenderSubmissionInput {
  projectId: string;
  enabledSections: TenderSectionId[];
  preparedBy?: string;
  checkedBy?: string;
  approvedBy?: string;
  assumptions?: string;
  exclusions?: string;
  commercialNotes?: string;
  exportTypes: TenderExportType[];
  title?: string;
}

export interface TenderPackageSnapshot {
  project: {
    id: string;
    project_code: string;
    project_name: string;
    client_name: string;
    location: string | null;
    status: string;
  };
  branding: TenderBrandingConfig;
  enabled_sections: TenderSectionId[];
  sections: Record<string, unknown>;
  generated_at: string;
}
