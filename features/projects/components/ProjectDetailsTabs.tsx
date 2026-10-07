'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants/routes';

interface ProjectDetailsTabsProps {
  projectId: string;
}

const TABS = [
  { label: 'Overview', href: (id: string) => ROUTES.project(id) },
  { label: 'WBS', href: (id: string) => ROUTES.projectWbs(id) },
  { label: 'BOQ', href: (id: string) => ROUTES.projectBoq(id) },
  {
    label: 'Quantity Takeoff',
    href: (id: string) => ROUTES.projectTakeoff(id),
  },
  { label: 'Rate Library', href: (id: string) => ROUTES.projectRates(id) },
  {
    label: 'AI Estimator',
    href: (id: string) => ROUTES.projectAiEstimator(id),
  },
  {
    label: 'Estimate Summary',
    href: (id: string) => ROUTES.projectSummary(id),
  },
  {
    label: 'Tender',
    href: (id: string) => ROUTES.projectTender(id),
  },
  {
    label: 'Validation',
    href: (id: string) => ROUTES.projectValidation(id),
  },
  {
    label: 'Audit History',
    href: (id: string) => ROUTES.projectAudit(id),
  },
] as const;

export function ProjectDetailsTabs({
  projectId,
}: ProjectDetailsTabsProps): React.JSX.Element {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Project modules"
      className="mb-6 flex gap-1 overflow-x-auto border-b border-border"
    >
      {TABS.map((tab) => {
        const href = tab.href(projectId);
        const isActive =
          tab.label === 'Overview'
            ? pathname === href
            : pathname.startsWith(href);

        return (
          <Link
            key={tab.label}
            href={href}
            className={cn(
              'shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-all duration-200',
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
