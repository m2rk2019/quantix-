'use client';

import { Badge } from '@/components/ui/badge';
import type { AiQuantityExplanation } from '@/types/ai-estimator';

interface AiQuantityExplainerProps {
  explanation: AiQuantityExplanation;
  compact?: boolean;
}

const CONFIDENCE_VARIANT: Record<
  AiQuantityExplanation['confidence_level'],
  'default' | 'secondary' | 'outline'
> = {
  high: 'default',
  medium: 'secondary',
  low: 'outline',
};

export function AiQuantityExplainer({
  explanation,
  compact = false,
}: AiQuantityExplainerProps): React.JSX.Element {
  const percent = Math.round(explanation.confidence * 100);

  if (compact) {
    return (
      <p className="text-xs text-muted-foreground">
        <Badge variant={CONFIDENCE_VARIANT[explanation.confidence_level]} className="mr-2">
          {percent}%
        </Badge>
        {explanation.formula}
      </p>
    );
  }

  return (
    <div className="rounded-md border bg-muted/20 p-3 text-sm">
      <div className="mb-2">
        <Badge variant={CONFIDENCE_VARIANT[explanation.confidence_level]}>
          {percent}% — {explanation.confidence_level}
        </Badge>
      </div>
      <p>
        <span className="font-medium">Formula: </span>
        {explanation.formula}
      </p>
      <p className="mt-1">
        <span className="font-medium">Assumption: </span>
        {explanation.engineering_assumption}
      </p>
      <p className="mt-1 text-muted-foreground">
        <span className="font-medium text-foreground">Reference: </span>
        {explanation.reference_basis}
      </p>
    </div>
  );
}
