import type {
  ContractType,
  CurrencyCode,
  DefaultUnitSystem,
  MeasurementSystem,
  ProjectType,
  RoundingRule,
} from '@/types/project';

export const CURRENCY_OPTIONS: readonly {
  value: CurrencyCode;
  label: string;
}[] = [
  { value: 'PHP', label: 'PHP — Philippine Peso' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'AED', label: 'AED — UAE Dirham' },
  { value: 'SAR', label: 'SAR — Saudi Riyal' },
  { value: 'AUD', label: 'AUD — Australian Dollar' },
  { value: 'CAD', label: 'CAD — Canadian Dollar' },
] as const;

export const PROJECT_TYPE_OPTIONS: readonly {
  value: ProjectType;
  label: string;
}[] = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'civil', label: 'Civil' },
  { value: 'renovation', label: 'Renovation' },
  { value: 'other', label: 'Other' },
] as const;

export const CONTRACT_TYPE_OPTIONS: readonly {
  value: ContractType;
  label: string;
}[] = [
  { value: 'lump_sum', label: 'Lump Sum' },
  { value: 'unit_price', label: 'Unit Price' },
  { value: 'cost_plus', label: 'Cost Plus' },
  { value: 'design_build', label: 'Design & Build' },
  { value: 'management', label: 'Management' },
  { value: 'other', label: 'Other' },
] as const;

export const MEASUREMENT_SYSTEM_OPTIONS: readonly {
  value: MeasurementSystem;
  label: string;
}[] = [
  { value: 'metric', label: 'Metric' },
  { value: 'imperial', label: 'Imperial' },
] as const;

export const DEFAULT_UNIT_SYSTEM_OPTIONS: readonly {
  value: DefaultUnitSystem;
  label: string;
}[] = [
  { value: 'metric_si', label: 'SI Metric (m, m², m³)' },
  { value: 'imperial_us', label: 'US Imperial (ft, sf, cy)' },
  { value: 'metric_imperial_hybrid', label: 'Metric / Imperial Hybrid' },
] as const;

export const ROUNDING_RULE_OPTIONS: readonly {
  value: RoundingRule;
  label: string;
}[] = [
  { value: 'half_up', label: 'Half Up' },
  { value: 'half_down', label: 'Half Down' },
  { value: 'round_up', label: 'Round Up' },
  { value: 'round_down', label: 'Round Down' },
] as const;
