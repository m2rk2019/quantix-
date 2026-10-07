'use client';

import { useState } from 'react';

import { AccuracyDashboardPanel } from '@/features/benchmark/components/AccuracyDashboardPanel';
import { BenchmarkImportPanel } from '@/features/benchmark/components/BenchmarkImportPanel';
import { BenchmarkReportsToolbar } from '@/features/benchmark/components/BenchmarkReportsToolbar';
import { FormulaAuditPanel } from '@/features/benchmark/components/FormulaAuditPanel';
import { ValidationCenterPanel } from '@/features/benchmark/components/ValidationCenterPanel';
import { Button } from '@/components/ui/button';
import type { AccuracyDashboardData } from '@/types/benchmark';
import type { BenchmarkValidationResult } from '@/types/benchmark';
import type { FormulaAuditResult } from '@/types/benchmark';

type Tab = 'dashboard' | 'validation' | 'formula' | 'import';

interface BenchmarkModuleProps {
  dashboard: AccuracyDashboardData;
  projects: Array<{ id: string; project_code: string; project_name: string }>;
  initialValidation: BenchmarkValidationResult | null;
  initialFormulaAudit: FormulaAuditResult | null;
  selectedProjectId: string | null;
}

export function BenchmarkModule({
  dashboard,
  projects,
  initialValidation,
  initialFormulaAudit,
  selectedProjectId,
}: BenchmarkModuleProps): React.JSX.Element {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [projectId, setProjectId] = useState(selectedProjectId ?? projects[0]?.id ?? '');

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'dashboard', label: 'Accuracy Dashboard' },
    { id: 'validation', label: 'Validation Center' },
    { id: 'formula', label: 'Formula Audit' },
    { id: 'import', label: 'Data Import' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b pb-3">
        {tabs.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant={tab === item.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <BenchmarkReportsToolbar projectId={projectId || undefined} />

      {tab === 'dashboard' && <AccuracyDashboardPanel data={dashboard} />}

      {(tab === 'validation' || tab === 'formula') && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-muted-foreground" htmlFor="benchmark-project">
            Project
          </label>
          <select
            id="benchmark-project"
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
            value={projectId}
            onChange={(event) => {
              setProjectId(event.target.value);
              window.location.href = `/admin/benchmarks?projectId=${event.target.value}`;
            }}
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.project_code} — {project.project_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {tab === 'validation' && initialValidation && (
        <ValidationCenterPanel result={initialValidation} />
      )}

      {tab === 'formula' && initialFormulaAudit && (
        <FormulaAuditPanel audit={initialFormulaAudit} />
      )}

      {tab === 'import' && <BenchmarkImportPanel />}
    </div>
  );
}
