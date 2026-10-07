'use client';

import { Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface AiProjectWizardProps {
  description: string;
  isGenerating: boolean;
  onDescriptionChange: (value: string) => void;
  onGenerate: () => void;
}

const EXAMPLE =
  'Construct a 10-storey office building with 2 basement parking and roof deck.';

export function AiProjectWizard({
  description,
  isGenerating,
  onDescriptionChange,
  onGenerate,
}: AiProjectWizardProps): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Project Wizard
        </CardTitle>
        <CardDescription>
          Describe the project in natural language. Quantix will propose WBS, BOQ,
          resource mapping, and rate analysis for your review before saving.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ai-project-description">Project description</Label>
          <Textarea
            id="ai-project-description"
            rows={4}
            value={description}
            placeholder={EXAMPLE}
            onChange={(event) => onDescriptionChange(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Example: {EXAMPLE}
          </p>
        </div>
        <Button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating || description.trim().length < 12}
        >
          {isGenerating ? 'Generating estimate…' : 'Generate estimate plan'}
        </Button>
      </CardContent>
    </Card>
  );
}
