'use client';

import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface WbsAddNodeDialogProps {
  open: boolean;
  title: string;
  description: string;
  value: string;
  isSubmitting: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function WbsAddNodeDialog({
  open,
  title,
  description,
  value,
  isSubmitting,
  onChange,
  onSubmit,
  onCancel,
}: WbsAddNodeDialogProps): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="wbs-node-description">Description</Label>
          <Input
            id="wbs-node-description"
            ref={inputRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Enter WBS description"
            maxLength={500}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && value.trim()) {
                event.preventDefault();
                onSubmit();
              }
            }}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || !value.trim()}
          >
            Add Node
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
