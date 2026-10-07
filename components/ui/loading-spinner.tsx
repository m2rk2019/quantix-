import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
} as const;

export function LoadingSpinner({
  className,
  label = 'Loading',
  size = 'md',
}: LoadingSpinnerProps): React.JSX.Element {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3', className)}
      role="status"
      aria-live="polite"
    >
      <Loader2
        className={cn('animate-spin text-primary', sizeClasses[size])}
        aria-hidden
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
