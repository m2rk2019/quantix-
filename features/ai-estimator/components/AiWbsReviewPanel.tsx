'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AiSuggestionExplainer } from '@/features/ai-estimator/components/AiSuggestionExplainer';
import type { AiWbsSuggestion } from '@/types/ai-estimator';

interface AiWbsReviewPanelProps {
  nodes: AiWbsSuggestion[];
  onToggle: (tempId: string, selected: boolean) => void;
}

export function AiWbsReviewPanel({
  nodes,
  onToggle,
}: AiWbsReviewPanelProps): React.JSX.Element {
  const selectedCount = nodes.filter((node) => node.selected).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>WBS Review</CardTitle>
        <CardDescription>
          {selectedCount} of {nodes.length} nodes selected. Review before saving.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {nodes.map((node) => (
          <div
            key={node.temp_id}
            className="rounded-lg border p-3"
            style={{ marginLeft: `${(node.level - 1) * 16}px` }}
          >
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1"
                checked={node.selected}
                onChange={(event) => onToggle(node.temp_id, event.target.checked)}
              />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {node.wbs_code}
                  </span>
                  <span className="font-medium">{node.description}</span>
                </div>
                <AiSuggestionExplainer explanation={node.explanation} compact />
              </div>
            </label>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
