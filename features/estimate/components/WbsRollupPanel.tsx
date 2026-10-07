'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatCurrency } from '@/lib/format-currency';
import { cn } from '@/lib/utils';
import type { WbsRollupNode } from '@/types/estimate';
import type { CurrencyCode } from '@/types/project';

interface WbsRollupPanelProps {
  nodes: WbsRollupNode[];
  currency: CurrencyCode;
}

function RollupRow({
  node,
  currency,
  depth,
  expandedIds,
  onToggle,
}: {
  node: WbsRollupNode;
  currency: CurrencyCode;
  depth: number;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
}): React.JSX.Element {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);

  return (
    <>
      <div
        className="grid grid-cols-[32px_88px_1fr_120px] items-center gap-2 border-b px-3 py-2 text-sm last:border-b-0"
        style={{ paddingLeft: `${12 + depth * 20}px` }}
      >
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted"
          onClick={() => hasChildren && onToggle(node.id)}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <span className="h-4 w-4" />
          )}
        </button>
        <span className="font-mono text-muted-foreground">{node.wbs_code}</span>
        <span className="truncate">{node.description}</span>
        <span className="text-right font-medium tabular-nums">
          {formatCurrency(node.combined_total, currency)}
        </span>
      </div>

      {hasChildren &&
        isExpanded &&
        node.children.map((child) => (
          <RollupRow
            key={child.id}
            node={child}
            currency={currency}
            depth={depth + 1}
            expandedIds={expandedIds}
            onToggle={onToggle}
          />
        ))}
    </>
  );
}

export function WbsRollupPanel({
  nodes,
  currency,
}: WbsRollupPanelProps): React.JSX.Element {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    return new Set(nodes.map((node) => node.id));
  });

  const allIds = useMemo(() => {
    const ids: string[] = [];
    function walk(node: WbsRollupNode): void {
      if (node.children.length > 0) {
        ids.push(node.id);
      }
      node.children.forEach(walk);
    }
    nodes.forEach(walk);
    return ids;
  }, [nodes]);

  function toggle(id: string): void {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>WBS Rollup</CardTitle>
          <CardDescription>
            Combined BOQ totals by work breakdown structure.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => setExpandedIds(new Set(allIds))}
          >
            Expand all
          </button>
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => setExpandedIds(new Set())}
          >
            Collapse all
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-[32px_88px_1fr_120px] gap-2 border-b bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
          <span />
          <span>Code</span>
          <span>Description</span>
          <span className="text-right">Total</span>
        </div>
        {nodes.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            No WBS nodes to display.
          </p>
        ) : (
          <div className={cn('max-h-[min(70vh,640px)] overflow-auto')}>
            {nodes.map((node) => (
              <RollupRow
                key={node.id}
                node={node}
                currency={currency}
                depth={0}
                expandedIds={expandedIds}
                onToggle={toggle}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
