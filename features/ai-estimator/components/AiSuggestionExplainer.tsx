'use client';

import { Badge } from '@/components/ui/badge';
import type { AiExplanation } from '@/types/ai-estimator';

interface AiSuggestionExplainerProps {
  explanation: AiExplanation;
  compact?: boolean;
}

const SOURCE_LABELS: Record<AiExplanation['source'], string> = {
  company_library: 'Company Library',
  project_library: 'Project Library',
  ai_estimated: 'AI Estimated',
  engineering_rule: 'Engineering Rule',
  learned_pattern: 'Learned Pattern',
};

const CONFIDENCE_VARIANT: Record<
  AiExplanation['confidence_level'],
  'default' | 'secondary' | 'outline'
> = {
  high: 'default',
  medium: 'secondary',
  low: 'outline',
};

export function AiSuggestionExplainer({
  explanation,
  compact = false,
}: AiSuggestionExplainerProps): React.JSX.Element {
  const confidencePercent = Math.round(explanation.confidence * 100);

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant={CONFIDENCE_VARIANT[explanation.confidence_level]}>
          {confidencePercent}% confidence
        </Badge>
        <span>{SOURCE_LABELS[explanation.source]}</span>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-muted/30 p-3 text-sm">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge variant={CONFIDENCE_VARIANT[explanation.confidence_level]}>
          {confidencePercent}% — {explanation.confidence_level}
        </Badge>
        <Badge variant="outline">{SOURCE_LABELS[explanation.source]}</Badge>
      </div>
      <p>
        <span className="font-medium">Why: </span>
        {explanation.why}
      </p>
      <p className="mt-1 text-muted-foreground">
        <span className="font-medium text-foreground">Formula: </span>
        {explanation.formula_or_assumption}
      </p>
    </div>
  );
}
