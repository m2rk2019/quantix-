'use client';

import { ChevronRight } from 'lucide-react';

import type { WbsNodePathSegment } from '@/types/wbs';

interface WbsNodeBreadcrumbProps {
  path: WbsNodePathSegment[];
  onNavigate: (nodeId: string) => void;
}

export function WbsNodeBreadcrumb({
  path,
  onNavigate,
}: WbsNodeBreadcrumbProps): React.JSX.Element | null {
  if (path.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Selected WBS path"
      className="mb-4 flex flex-wrap items-center gap-1 rounded-md border bg-muted/30 px-3 py-2 text-sm"
    >
      {path.map((segment, index) => {
        const isLast = index === path.length - 1;
        return (
          <span key={segment.id} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight
                className="h-3.5 w-3.5 text-muted-foreground"
                aria-hidden
              />
            )}
            {isLast ? (
              <span className="font-medium">
                <span className="font-mono text-muted-foreground">
                  {segment.wbs_code}
                </span>{' '}
                {segment.description}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate(segment.id)}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <span className="font-mono">{segment.wbs_code}</span>{' '}
                {segment.description}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
