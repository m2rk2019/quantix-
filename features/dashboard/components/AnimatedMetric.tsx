'use client';

import { useEffect, useState } from 'react';

import { formatCurrency } from '@/lib/format-currency';

interface AnimatedMetricProps {
  value: number;
  format?: 'number' | 'currency' | 'percent';
  decimals?: number;
  className?: string;
}

function easeOutCubic(progress: number): number {
  return 1 - Math.pow(1 - progress, 3);
}

export function AnimatedMetric({
  value,
  format = 'number',
  decimals = 0,
  className,
}: AnimatedMetricProps): React.JSX.Element {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!Number.isFinite(value)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset invalid metric display
      setDisplay(0);
      return;
    }

    let frame = 0;
    const duration = 900;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplay(value * easeOutCubic(progress));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  let formatted: string;
  if (format === 'currency') {
    formatted = formatCurrency(display);
  } else if (format === 'percent') {
    formatted = `${display.toFixed(decimals)}%`;
  } else {
    formatted = String(Math.round(display));
  }

  return <span className={className}>{formatted}</span>;
}
