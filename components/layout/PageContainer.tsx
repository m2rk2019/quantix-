import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({
  children,
  className,
}: PageContainerProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-[1440px] px-4 py-6 md:px-8 md:py-8',
        className
      )}
    >
      {children}
    </div>
  );
}
