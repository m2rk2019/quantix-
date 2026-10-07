'use client';

import { useState } from 'react';

import { FormulaVerificationPanel } from '@/features/uat/components/FormulaVerificationPanel';
import { UatChecklistPanel } from '@/features/uat/components/UatChecklistPanel';
import { UatDashboardPanel } from '@/features/uat/components/UatDashboardPanel';
import { UatPerformancePanel } from '@/features/uat/components/UatPerformancePanel';
import { UatReportsToolbar } from '@/features/uat/components/UatReportsToolbar';
import { Button } from '@/components/ui/button';
import type { UatSuitePageData } from '@/types/uat';

type Tab = 'dashboard' | 'checklist' | 'formula' | 'performance';

interface UatModuleProps {
  data: UatSuitePageData;
}

export function UatModule({ data }: UatModuleProps): React.JSX.Element {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [projectId, setProjectId] = useState(data.selectedProjectId ?? '');

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'dashboard', label: 'UAT Dashboard' },
    { id: 'checklist', label: 'Checklist' },
    { id: 'formula', label: 'Formula Verification' },
    { id: 'performance', label: 'Performance Tests' },
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

      <UatReportsToolbar projectId={projectId || undefined} />

      {tab === 'dashboard' && (
        <UatDashboardPanel
          checklist={data.checklist}
          automatedChecks={data.automated_checks}
          formulaAccuracy={data.formula_verification?.accuracy_percent ?? null}
          performancePassed={data.performance.all_passed}
        />
      )}

      {tab === 'checklist' && <UatChecklistPanel scenarios={data.scenarios} />}

      {tab === 'formula' && (
        <>
          {data.projects.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-sm text-muted-foreground" htmlFor="uat-project">
                Project
              </label>
              <select
                id="uat-project"
                className="rounded-md border bg-background px-3 py-1.5 text-sm"
                value={projectId}
                onChange={(event) => {
                  setProjectId(event.target.value);
                  window.location.href = `/admin/uat?projectId=${event.target.value}`;
                }}
              >
                {data.projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.project_code} — {project.project_name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {data.formula_verification ? (
            <FormulaVerificationPanel data={data.formula_verification} />
          ) : (
            <p className="text-sm text-muted-foreground">
              No BOQ items found for the selected project. Create a project with BOQ data or
              seed the formula validation demo.
            </p>
          )}
        </>
      )}

      {tab === 'performance' && <UatPerformancePanel data={data.performance} />}
    </div>
  );
}
