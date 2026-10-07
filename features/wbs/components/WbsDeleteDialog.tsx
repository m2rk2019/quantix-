'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface WbsDeleteDialogProps {
  open: boolean;
  wbsCode: string;
  description: string;
  childCount: number;
  boqCount: number;
  isLoadingImpact: boolean;
  isLoading: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const BLOCKED_MESSAGE =
  'This WBS cannot be deleted because it contains child items.';

export function WbsDeleteDialog({
  open,
  wbsCode,
  description,
  childCount,
  boqCount,
  isLoadingImpact,
  isLoading,
  error,
  onConfirm,
  onCancel,
}: WbsDeleteDialogProps): React.JSX.Element {
  const isBlocked = childCount > 0 || boqCount > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !isLoading) {
          onCancel();
        }
      }}
    >
      <DialogContent
        onPointerDownOutside={(event) => {
          if (isLoading) {
            event.preventDefault();
          }
        }}
        onEscapeKeyDown={(event) => {
          if (isLoading) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {isBlocked ? 'Cannot delete WBS' : 'Delete WBS item'}
          </DialogTitle>
          <DialogDescription>
            {wbsCode ? (
              <>
                <span className="font-mono text-foreground">{wbsCode}</span>
                {description ? <> — {description}</> : null}
              </>
            ) : (
              description || 'Selected WBS node'
            )}
          </DialogDescription>
        </DialogHeader>

        <p
          className={
            isBlocked || error
              ? 'text-sm text-destructive'
              : 'text-sm text-muted-foreground'
          }
          role={isBlocked || error ? 'alert' : undefined}
        >
          {isLoadingImpact
            ? 'Checking WBS usage…'
            : error
              ? error
              : isBlocked
                ? BLOCKED_MESSAGE
                : 'Delete this WBS item?'}
        </p>

        {!isBlocked && !isLoadingImpact && !error ? (
          <p className="text-sm text-muted-foreground">This cannot be undone.</p>
        ) : null}

        {!isBlocked && !isLoadingImpact ? (
          <p className="text-xs text-muted-foreground">
            Child WBS: {childCount} · BOQ items: {boqCount}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              if (!isLoading) {
                onCancel();
              }
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          {!isBlocked && (
            <Button
              type="button"
              variant="destructive"
              disabled={isLoading || isLoadingImpact}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                console.log('[WBS Delete] confirm button clicked');
                onConfirm();
              }}
            >
              {isLoading ? 'Deleting…' : 'Delete'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
