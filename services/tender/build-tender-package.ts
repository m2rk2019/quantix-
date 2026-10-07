import { createClient } from '@/lib/supabase/server';
import { toReportBranding } from '@/lib/company/branding';
import { getCompanySettings } from '@/services/company-settings/get-company-settings';
import { listBoqItems } from '@/services/boq/list-boq-items';
import { getEstimateSummary } from '@/services/estimate/get-estimate-summary';
import { getProjectById } from '@/services/projects/list-projects';
import type { BoqItem } from '@/types/boq';
import type {
  TenderBrandingConfig,
  TenderPackageSnapshot,
  TenderSectionId,
} from '@/types/tender';
import { DEFAULT_ENABLED_TENDER_SECTIONS } from '@/types/tender';

const BOQ_PAGE = 1000;

async function loadAllBoq(projectId: string): Promise<BoqItem[]> {
  const items: BoqItem[] = [];
  let page = 1;
  while (true) {
    const result = await listBoqItems(projectId, {
      page,
      pageSize: BOQ_PAGE,
      sort: 'item_code',
      order: 'asc',
    });
    items.push(...result.items);
    if (page >= result.totalPages) break;
    page += 1;
  }
  return items;
}

function flattenWbs(
  nodes: Array<{
    id: string;
    parent_id: string | null;
    wbs_code: string;
    description: string;
    level: number;
    sort_order: number;
    direct_total: number;
    combined_total: number;
    children: unknown[];
  }>,
  out: Array<Record<string, unknown>> = []
): Array<Record<string, unknown>> {
  for (const node of nodes) {
    out.push({
      wbs_code: node.wbs_code,
      description: node.description,
      level: node.level,
      direct_total: node.direct_total,
      combined_total: node.combined_total,
    });
    if (Array.isArray(node.children) && node.children.length > 0) {
      flattenWbs(node.children as typeof nodes, out);
    }
  }
  return out;
}

export interface TenderCommercialFields {
  assumptions: string;
  exclusions: string;
  commercial_notes: string;
  prepared_by_name: string | null;
  checked_by_name: string | null;
  approved_by_name: string | null;
}

export async function loadTenderCommercialFields(
  projectId: string
): Promise<TenderCommercialFields> {
  const empty: TenderCommercialFields = {
    assumptions: '',
    exclusions: '',
    commercial_notes: '',
    prepared_by_name: null,
    checked_by_name: null,
    approved_by_name: null,
  };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('project_details')
      .select(
        'assumptions, exclusions, commercial_notes, prepared_by_name, checked_by_name, approved_by_name'
      )
      .eq('project_id', projectId)
      .maybeSingle();

    if (error || !data) {
      return empty;
    }

    return {
      assumptions: (data.assumptions as string | null) ?? '',
      exclusions: (data.exclusions as string | null) ?? '',
      commercial_notes: (data.commercial_notes as string | null) ?? '',
      prepared_by_name: (data.prepared_by_name as string | null) ?? null,
      checked_by_name: (data.checked_by_name as string | null) ?? null,
      approved_by_name: (data.approved_by_name as string | null) ?? null,
    };
  } catch {
    return empty;
  }
}

export async function buildTenderPackageSnapshot(input: {
  projectId: string;
  enabledSections?: TenderSectionId[];
  preparedBy?: string;
  checkedBy?: string;
  approvedBy?: string;
  assumptions?: string;
  exclusions?: string;
  commercialNotes?: string;
}): Promise<TenderPackageSnapshot> {
  const project = await getProjectById(input.projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  const summary = await getEstimateSummary(input.projectId);
  if (!summary) {
    throw new Error('Estimate summary not available for this project.');
  }

  const [boqItems, company, commercial, aiEvents, rateRows] =
    await Promise.all([
      loadAllBoq(input.projectId),
      getCompanySettings(),
      loadTenderCommercialFields(input.projectId),
      (async () => {
        const supabase = await createClient();
        const { data } = await supabase
          .from('audit_log')
          .select('id, action, payload, created_at')
          .eq('project_id', input.projectId)
          .or('action.ilike.ai_estimate.%,action.ilike.ai.%')
          .order('created_at', { ascending: false })
          .limit(25);
        return data ?? [];
      })(),
      (async () => {
        const supabase = await createClient();
        const { data, error } = await supabase
          .from('project_rate_library_items')
          .select(
            'code, description, unit, unit_cost, category, supplier_id'
          )
          .eq('project_id', input.projectId)
          .is('deleted_at', null)
          .order('code', { ascending: true })
          .limit(2000);
        if (error) return [];
        return data ?? [];
      })(),
    ]);

  const brandingSettings = toReportBranding(company);
  const branding: TenderBrandingConfig = {
    company_name: brandingSettings.companyName,
    logo_url: brandingSettings.logoUrl,
    address: brandingSettings.address,
    phone: brandingSettings.phone,
    email: brandingSettings.email,
    website: brandingSettings.website,
    report_header: brandingSettings.reportHeader,
    report_footer: brandingSettings.reportFooter,
    prepared_by:
      input.preparedBy?.trim() ||
      commercial.prepared_by_name ||
      summary.bid_summary.prepared_by ||
      '—',
    checked_by:
      input.checkedBy?.trim() || commercial.checked_by_name || '—',
    approved_by:
      input.approvedBy?.trim() || commercial.approved_by_name || '—',
  };

  const assumptions =
    input.assumptions?.trim() ||
    commercial.assumptions ||
    'Rates are based on current market conditions and company resource library pricing at the date of estimate.';
  const exclusions =
    input.exclusions?.trim() ||
    commercial.exclusions ||
    'Works not expressly listed in the BOQ are excluded unless agreed in writing.';
  const commercialNotes =
    input.commercialNotes?.trim() ||
    commercial.commercial_notes ||
    'This tender submission is valid for 30 days from the estimate date unless otherwise stated.';

  const enabled =
    input.enabledSections && input.enabledSections.length > 0
      ? input.enabledSections
      : DEFAULT_ENABLED_TENDER_SECTIONS;

  const wbsFlat = flattenWbs(summary.wbs_rollup);
  const resourceAnalysis = rateRows.map((row) => ({
    code: row.code,
    description: row.description,
    unit: row.unit,
    unit_cost: Number(row.unit_cost),
    category: row.category,
  }));

  const sections: Record<string, unknown> = {
    cover_page: {
      project_code: project.project_code,
      project_name: project.project_name,
      client_name: project.client_name,
      location: project.location,
      status: project.status,
      estimate_date: summary.bid_summary.estimate_date,
      grand_total: summary.breakdown.grand_total,
      currency: summary.currency,
    },
    executive_summary: {
      narrative: `This tender package presents the cost estimate for ${project.project_name} (${project.project_code}) prepared for ${project.client_name}. The estimated grand total is ${summary.currency} ${summary.breakdown.grand_total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} based on ${summary.boq_item_count} BOQ items.`,
      top_items: summary.top_boq_items,
      discipline_breakdown: summary.discipline_breakdown,
    },
    estimate_summary: {
      percentages: summary.percentages,
      breakdown: summary.breakdown,
      resource_totals: summary.resource_totals,
    },
    boq: {
      items: boqItems.map((item) => ({
        item_code: item.item_code,
        description: item.description,
        unit: item.unit,
        quantity: item.quantity,
        total_rate: item.total_rate,
        total_amount: item.total_amount,
        wbs_code: item.wbs_code,
      })),
      count: boqItems.length,
    },
    detailed_resource_analysis: {
      resources: resourceAnalysis,
      count: resourceAnalysis.length,
      resource_totals: summary.resource_totals,
    },
    wbs_summary: {
      nodes: wbsFlat,
      count: wbsFlat.length,
    },
    cost_breakdown: {
      breakdown: summary.breakdown,
      percentages: summary.percentages,
      resource_totals: summary.resource_totals,
    },
    bid_composition: {
      bid_summary: summary.bid_summary,
      breakdown: summary.breakdown,
    },
    ai_insights: {
      events: aiEvents.map((event) => ({
        action: event.action,
        created_at: event.created_at,
        payload: event.payload,
      })),
      count: aiEvents.length,
    },
    assumptions: { text: assumptions },
    exclusions: { text: exclusions },
    commercial_notes: { text: commercialNotes },
  };

  // Keep only enabled section payloads in snapshot for lean storage,
  // but always retain assumptions text fields for commercial completeness.
  const filtered: Record<string, unknown> = {};
  for (const sectionId of enabled) {
    filtered[sectionId] = sections[sectionId];
  }

  return {
    project: {
      id: project.id,
      project_code: project.project_code,
      project_name: project.project_name,
      client_name: project.client_name,
      location: project.location,
      status: project.status,
    },
    branding,
    enabled_sections: enabled,
    sections: filtered,
    generated_at: new Date().toISOString(),
  };
}
