import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface PageTitleProps {
  title: string;
  className?: string;
  children?: ReactNode;
}

export function PageTitle({
  title,
  className,
  children,
}: PageTitleProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
      {children}
    </div>
  );
}
