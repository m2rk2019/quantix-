'use client';

import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { UAT_MODULE_LABELS, type UatModuleId, type UatScenario } from '@/types/uat';

interface UatChecklistPanelProps {
  scenarios: UatScenario[];
}

export function UatChecklistPanel({
  scenarios,
}: UatChecklistPanelProps): React.JSX.Element {
  const [moduleFilter, setModuleFilter] = useState<UatModuleId | 'all'>('all');
  const [search, setSearch] = useState('');

  const modules = useMemo(() => {
    const set = new Set(scenarios.map((s) => s.module));
    return Array.from(set).sort();
  }, [scenarios]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return scenarios.filter((scenario) => {
      if (moduleFilter !== 'all' && scenario.module !== moduleFilter) {
        return false;
      }
      if (!term) {
        return true;
      }
      return (
        scenario.id.toLowerCase().includes(term) ||
        scenario.title.toLowerCase().includes(term) ||
        scenario.steps.toLowerCase().includes(term)
      );
    });
  }, [scenarios, moduleFilter, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <select
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
          value={moduleFilter}
          onChange={(event) =>
            setModuleFilter(event.target.value as UatModuleId | 'all')
          }
        >
          <option value="all">All modules</option>
          {modules.map((module) => (
            <option key={module} value={module}>
              {UAT_MODULE_LABELS[module]}
            </option>
          ))}
        </select>
        <input
          type="search"
          placeholder="Search scenarios…"
          className="min-w-[200px] flex-1 rounded-md border bg-background px-3 py-1.5 text-sm"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Badge variant="outline">{filtered.length} scenarios</Badge>
      </div>

      <div className="overflow-x-auto rounded-lg border max-h-[560px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted/95">
            <tr className="border-b text-left">
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Module</th>
              <th className="px-3 py-2">Scenario</th>
              <th className="px-3 py-2">Expected</th>
              <th className="px-3 py-2">Automated</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((scenario) => (
              <tr key={scenario.id} className="border-b align-top">
                <td className="px-3 py-2 font-mono text-xs">{scenario.id}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {UAT_MODULE_LABELS[scenario.module]}
                </td>
                <td className="px-3 py-2">
                  <p className="font-medium">{scenario.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{scenario.steps}</p>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{scenario.expected}</td>
                <td className="px-3 py-2">
                  {scenario.verifyScript ? (
                    <code className="text-xs">{scenario.verifyScript}</code>
                  ) : (
                    <span className="text-muted-foreground">Manual</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-muted-foreground">
        Record results as P / PO / F / B / NT in{' '}
        <code className="text-xs">docs/UAT_CHECKLIST.md</code> or export the checklist report.
      </p>
    </div>
  );
}
