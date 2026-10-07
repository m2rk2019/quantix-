export function projectMetadataTag(projectId: string): string {
  return `project-metadata-${projectId}`;
}

export function projectWbsTag(projectId: string): string {
  return `project-wbs-${projectId}`;
}

export function projectSummaryTag(projectId: string): string {
  return `project-summary-${projectId}`;
}

export function projectBoqTag(projectId: string): string {
  return `project-boq-${projectId}`;
}

export function companySettingsTag(): string {
  return 'company-settings';
}
