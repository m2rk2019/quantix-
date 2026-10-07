'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

import { cn } from '@/lib/utils';

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  new: 'Create Project',
  wbs: 'WBS',
  boq: 'BOQ',
  summary: 'Estimate Summary',
  rates: 'Rate Library',
  audit: 'Audit History',
  admin: 'Administration',
  'resource-library': 'Resource Library',
  materials: 'Material Library',
  labor: 'Labor Library',
  equipment: 'Equipment Library',
  subcontract: 'Subcontract Library',
  suppliers: 'Supplier Library',
  units: 'Units of Measure',
  categories: 'Resource Categories',
  settings: 'Company Settings',
  benchmarks: 'Benchmarks',
  uat: 'UAT Suite',
  demo: 'Pilot Demo',
  validation: 'Validation',
  'ai-estimator': 'AI Estimator',
};

function formatSegment(segment: string): string {
  if (SEGMENT_LABELS[segment]) {
    return SEGMENT_LABELS[segment];
  }

  if (/^[0-9a-f-]{36}$/i.test(segment) || segment.length > 12) {
    return 'Project';
  }

  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function buildHref(segments: string[], index: number): string {
  return `/${segments.slice(0, index + 1).join('/')}`;
}

export function Breadcrumb(): React.JSX.Element | null {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
      <ol className="flex min-w-0 items-center gap-1.5 text-sm">
        <li className="flex shrink-0 items-center">
          <Link
            href="/dashboard"
            className="flex items-center text-muted-foreground transition-colors duration-200 hover:text-primary"
            aria-label="Home"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const label = formatSegment(segment);
          const href = buildHref(segments, index);

          return (
            <li key={href} className="flex min-w-0 items-center gap-1.5">
              <ChevronRight
                className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60"
                aria-hidden
              />
              {isLast ? (
                <span
                  className="truncate font-semibold text-foreground"
                  aria-current="page"
                >
                  {label}
                </span>
              ) : (
                <Link
                  href={href}
                  className={cn(
                    'truncate text-muted-foreground transition-colors duration-200 hover:text-primary'
                  )}
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
