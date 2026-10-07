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

interface WbsBulkDeleteDialogProps {
  open: boolean;
  selectedCount: number;
  isLoading: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function WbsBulkDeleteDialog({
  open,
  selectedCount,
  isLoading,
  error,
  onConfirm,
  onCancel,
}: WbsBulkDeleteDialogProps): React.JSX.Element {
  const countLabel = `${selectedCount} selected WBS item${selectedCount === 1 ? '' : 's'}`;

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
          <DialogTitle>Delete selected WBS</DialogTitle>
          <DialogDescription>
            {`Delete ${selectedCount} selected WBS item${selectedCount === 1 ? '' : 's'}?`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            All child nodes and related BOQ items under {countLabel} will also be
            deleted.
          </p>
          <p>This cannot be undone.</p>
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              if (!isLoading) {
                onCancel();
              }
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isLoading || selectedCount === 0}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onConfirm();
            }}
          >
            {isLoading ? 'Deleting…' : 'Delete Selected'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
