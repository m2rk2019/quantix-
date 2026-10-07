import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div
      className={cn('animate-pulse rounded-[10px] bg-muted', className)}
      {...props}
    />
  );
}

function TableSkeleton({
  rows = 8,
  columns = 6,
}: {
  rows?: number;
  columns?: number;
}): React.JSX.Element {
  return (
    <div className="space-y-2 rounded-[14px] border border-border p-4" aria-hidden>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={`head-${index}`} className="h-4" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((__, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} className="h-8" />
          ))}
        </div>
      ))}
    </div>
  );
}

function PanelSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-4 rounded-[14px] border border-border p-6" aria-hidden>
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-4 w-64" />
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-2/3" />
      </div>
    </div>
  );
}

export { Skeleton, TableSkeleton, PanelSkeleton };
