import type { ReportBranding } from '@/types/company-settings';
import type { CurrencyCode, ProjectStatus } from '@/types/project';
import type {
  BoqResourceTotals,
  DisciplineBreakdownItem,
  EstimateBreakdown,
  EstimatePercentages,
  WbsRollupNode,
} from '@/types/estimate';
import type { BoqItem } from '@/types/boq';

export interface ExcelExportProjectInfo {
  project_code: string;
  project_name: string;
  client_name: string;
  location: string | null;
  estimator_name: string;
  export_date: string;
  currency: CurrencyCode;
  status: ProjectStatus;
}

export interface ExcelExportData {
  project: ExcelExportProjectInfo;
  breakdown: EstimateBreakdown;
  percentages: EstimatePercentages;
  resourceTotals: BoqResourceTotals;
  disciplineBreakdown: DisciplineBreakdownItem[];
  wbsRollup: WbsRollupNode[];
  boqItems: BoqItem[];
  branding: ReportBranding;
}

export interface ExcelExportResult {
  buffer: Buffer;
  filename: string;
}
