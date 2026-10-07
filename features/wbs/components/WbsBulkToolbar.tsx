'use client';

import {
  ChevronDown,
  ChevronUp,
  Trash2,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

interface WbsBulkToolbarProps {
  selectedCount: number;
  canEdit: boolean;
  isBusy: boolean;
  onDeleteSelected: () => void;
  onExpandSelected: () => void;
  onCollapseSelected: () => void;
  onClearSelection: () => void;
}

export function WbsBulkToolbar({
  selectedCount,
  canEdit,
  isBusy,
  onDeleteSelected,
  onExpandSelected,
  onCollapseSelected,
  onClearSelection,
}: WbsBulkToolbarProps): React.JSX.Element | null {
  if (selectedCount <= 0) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4"
      role="toolbar"
      aria-label="WBS selection actions"
    >
      <div className="pointer-events-auto flex max-w-full flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
        <span className="px-1 text-sm font-medium text-foreground">
          {selectedCount} selected
        </span>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isBusy}
          onClick={onExpandSelected}
        >
          <ChevronDown className="h-4 w-4" />
          Expand Selected
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isBusy}
          onClick={onCollapseSelected}
        >
          <ChevronUp className="h-4 w-4" />
          Collapse Selected
        </Button>

        {canEdit ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isBusy || selectedCount === 0}
            onClick={onDeleteSelected}
          >
            <Trash2 className="h-4 w-4" />
            Delete Selected
          </Button>
        ) : null}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isBusy}
          onClick={onClearSelection}
        >
          <X className="h-4 w-4" />
          Clear Selection
        </Button>
      </div>
    </div>
  );
}
