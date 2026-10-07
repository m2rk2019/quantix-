'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/format-currency';
import type { AiAlternativeSuggestion } from '@/types/ai-estimator';
import type { CurrencyCode } from '@/types/project';

interface AiAlternativesPanelProps {
  alternatives: AiAlternativeSuggestion[];
  currency: CurrencyCode;
}

const TYPE_LABELS: Record<AiAlternativeSuggestion['type'], string> = {
  cheaper_material: 'Cheaper Material',
  alternative_method: 'Alternative Method',
  value_engineering: 'Value Engineering',
};

export function AiAlternativesPanel({
  alternatives,
  currency,
}: AiAlternativesPanelProps): React.JSX.Element {
  if (alternatives.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Alternatives</CardTitle>
          <CardDescription>No value engineering alternatives identified.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Alternatives</CardTitle>
        <CardDescription>
          Value engineering and alternative construction options
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {alternatives.map((alt) => (
          <div key={alt.id} className="rounded-lg border p-3 text-sm">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{TYPE_LABELS[alt.type]}</Badge>
              <span className="font-medium">{alt.title}</span>
            </div>
            <p className="text-muted-foreground">{alt.description}</p>
            <p className="mt-2 text-xs">
              Potential savings:{' '}
              <span className="font-medium text-primary">
                {formatCurrency(alt.potential_savings, currency)}
              </span>
              {' · '}
              Confidence: {Math.round(alt.confidence * 100)}%
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
