'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AiScopeIssue } from '@/types/ai-estimator';

interface AiScopeCheckerPanelProps {
  issues: AiScopeIssue[];
}

const SEVERITY_VARIANT: Record<
  AiScopeIssue['severity'],
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  error: 'destructive',
  warning: 'secondary',
  info: 'outline',
};

export function AiScopeCheckerPanel({
  issues,
}: AiScopeCheckerPanelProps): React.JSX.Element {
  const errors = issues.filter((issue) => issue.severity === 'error');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scope Checker</CardTitle>
        <CardDescription>
          {errors.length === 0
            ? 'No blocking issues detected.'
            : `${errors.length} blocking issue(s) must be resolved before apply.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {issues.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            All scope checks passed for the current selection.
          </p>
        ) : (
          issues.map((issue) => (
            <div
              key={issue.id}
              className="flex items-start gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <Badge variant={SEVERITY_VARIANT[issue.severity]}>
                {issue.severity}
              </Badge>
              <span>{issue.message}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
