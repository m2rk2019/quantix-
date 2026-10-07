'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Wand2 } from 'lucide-react';

import { ConnectivityBanner } from '@/components/connectivity/ConnectivityBanner';
import { Button } from '@/components/ui/button';
import { AiAlternativesPanel } from '@/features/ai-estimator/components/AiAlternativesPanel';
import { AiBoqReviewPanel } from '@/features/ai-estimator/components/AiBoqReviewPanel';
import { AiChatPanel } from '@/features/ai-estimator/components/AiChatPanel';
import { AiProjectWizard } from '@/features/ai-estimator/components/AiProjectWizard';
import { AiScopeCheckerPanel } from '@/features/ai-estimator/components/AiScopeCheckerPanel';
import { AiWbsReviewPanel } from '@/features/ai-estimator/components/AiWbsReviewPanel';
import { calculateTotalAmount, roundCurrency } from '@/lib/boq/calculations';
import { runScopeChecker, hasBlockingScopeIssues } from '@/lib/ai-estimator/scope-checker';
import {
  applyAiEstimatePlanAction,
  generateAiEstimatePlanAction,
} from '@/services/ai-estimator/ai-estimator-actions';
import type { AiEstimatePlan } from '@/types/ai-estimator';
import type { CurrencyCode, ProjectStatus } from '@/types/project';
import { PROJECT_STATUS_LABELS } from '@/types/project';

interface AiEstimatorModuleProps {
  projectId: string;
  projectStatus: ProjectStatus;
  canEdit: boolean;
  currency: CurrencyCode;
}

function recalculatePlan(plan: AiEstimatePlan): AiEstimatePlan {
  return {
    ...plan,
    scope_issues: runScopeChecker(plan),
  };
}

export function AiEstimatorModule({
  projectId,
  projectStatus,
  canEdit,
  currency,
}: AiEstimatorModuleProps): React.JSX.Element {
  const router = useRouter();
  const [description, setDescription] = useState(
    'Construct a 10-storey office building with 2 basement parking and roof deck.'
  );
  const [plan, setPlan] = useState<AiEstimatePlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isReadOnly =
    !canEdit || projectStatus === 'archived' || projectStatus === 'approved';

  const blockingIssues = useMemo(
    () => (plan ? hasBlockingScopeIssues(plan.scope_issues) : false),
    [plan]
  );

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await generateAiEstimatePlanAction(projectId, description);
      if (!result.success || !result.plan) {
        setError(result.error ?? 'Failed to generate estimate plan.');
        return;
      }
      setPlan(result.plan);
    } catch (generateError) {
      setError(
        generateError instanceof Error
          ? generateError.message
          : 'Failed to generate estimate plan.'
      );
    } finally {
      setIsGenerating(false);
    }
  }, [description, projectId]);

  const handleOneClick = useCallback(async () => {
    if (!plan || isReadOnly) {
      return;
    }

    setIsApplying(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await applyAiEstimatePlanAction(plan);
      if (!result.success) {
        setError(result.error ?? 'Failed to apply AI estimate.');
        return;
      }

      setSuccess(
        `Created ${result.wbs_created ?? 0} WBS nodes, ${result.boq_created ?? 0} BOQ items, and ${result.rate_analysis_saved ?? 0} rate analyses.`
      );
      router.refresh();
    } catch (applyError) {
      setError(
        applyError instanceof Error
          ? applyError.message
          : 'Failed to apply AI estimate.'
      );
    } finally {
      setIsApplying(false);
    }
  }, [isReadOnly, plan, router]);

  function toggleWbs(tempId: string, selected: boolean): void {
    setPlan((current) => {
      if (!current) {
        return current;
      }
      const next = {
        ...current,
        wbs: current.wbs.map((node) =>
          node.temp_id === tempId ? { ...node, selected } : node
        ),
      };
      return recalculatePlan(next);
    });
  }

  function toggleBoq(tempId: string, selected: boolean): void {
    setPlan((current) => {
      if (!current) {
        return current;
      }
      const next = {
        ...current,
        boq: current.boq.map((item) =>
          item.temp_id === tempId ? { ...item, selected } : item
        ),
      };
      return recalculatePlan(next);
    });
  }

  function updateQuantity(tempId: string, quantity: number): void {
    setPlan((current) => {
      if (!current) {
        return current;
      }

      const next = {
        ...current,
        boq: current.boq.map((item) => {
          if (item.temp_id !== tempId) {
            return item;
          }

          const safeQty = roundCurrency(Math.max(0, quantity));
          return {
            ...item,
            quantity: safeQty,
            total_amount: calculateTotalAmount(safeQty, item.total_rate),
            user_edited_quantity: true,
          };
        }),
      };

      return recalculatePlan(next);
    });
  }

  return (
    <div className="space-y-6">
      <ConnectivityBanner onRetry={() => void handleGenerate()} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Construction Copilot · Engineering Knowledge Engine · Status:{' '}
          {PROJECT_STATUS_LABELS[projectStatus]}
          {isReadOnly ? ' · Read-only' : ''}
        </p>
        {plan ? (
          <Button
            type="button"
            onClick={() => void handleOneClick()}
            disabled={isApplying || isReadOnly || blockingIssues}
          >
            <Wand2 className={isApplying ? 'h-4 w-4 animate-pulse' : 'h-4 w-4'} />
            {isApplying ? 'Applying…' : 'One-click apply to project'}
          </Button>
        ) : null}
      </div>

      {error ? (
        <div
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {success ? (
        <div
          className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm"
          role="status"
        >
          <CheckCircle2 className="h-4 w-4 text-primary" />
          {success}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <AiProjectWizard
            description={description}
            isGenerating={isGenerating}
            onDescriptionChange={setDescription}
            onGenerate={() => void handleGenerate()}
          />

          {plan ? (
            <>
              <div className="rounded-lg border bg-muted/20 px-4 py-3 text-sm">
                <p className="font-medium">Parsed brief</p>
                <p className="mt-1 text-muted-foreground">
                  {plan.description.building_type} · {plan.description.storeys} storeys ·{' '}
                  {plan.description.basement_levels} basement · GFA ~
                  {plan.description.gross_floor_area_m2.toLocaleString()} m²
                  {plan.description.has_roof_deck ? ' · roof deck' : ''}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {plan.library_items_matched} company resources matched ·{' '}
                  {plan.boq.filter((item) => item.selected).length} BOQ items ·
                  Knowledge v{plan.knowledge_version}
                  {plan.learning_boost_applied > 0
                    ? ` · Learning boost +${Math.round(plan.learning_boost_applied * 100)}%`
                    : ''}
                </p>
              </div>

              <AiWbsReviewPanel nodes={plan.wbs} onToggle={toggleWbs} />
              <AiBoqReviewPanel
                items={plan.boq}
                currency={currency}
                onToggle={toggleBoq}
                onQuantityChange={updateQuantity}
              />
              <AiScopeCheckerPanel issues={plan.scope_issues} />
              <AiAlternativesPanel
                alternatives={plan.alternatives}
                currency={currency}
              />
            </>
          ) : null}
        </div>

        <AiChatPanel projectId={projectId} plan={plan} />
      </div>
    </div>
  );
}
