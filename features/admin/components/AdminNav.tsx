'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants/routes';

const ADMIN_NAV = [
  { label: 'Company Settings', href: ROUTES.adminSettings },
  { label: 'Benchmarks', href: ROUTES.adminBenchmarks },
  { label: 'UAT Suite', href: ROUTES.adminUat },
  { label: 'Pilot Demo', href: ROUTES.adminDemo },
  { label: 'Resource Library', href: ROUTES.resourceLibraryMaterials },
] as const;

interface AdminNavProps {
  className?: string;
}

export function AdminNav({ className }: AdminNavProps): React.JSX.Element {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        'mb-6 flex flex-wrap gap-2 border-b border-border pb-4',
        className
      )}
    >
      {ADMIN_NAV.map(({ label, href }) => {
        const isActive =
          href === ROUTES.resourceLibraryMaterials
            ? pathname.startsWith('/admin/resource-library')
            : pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'rounded-[10px] px-3 py-2 text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-primary-subtle text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
