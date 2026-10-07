'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';
import {
  RESOURCE_LIBRARY_SECTION_LABELS,
  RESOURCE_LIBRARY_SECTIONS,
  type ResourceLibrarySection,
} from '@/types/resource-library';

const SECTION_ROUTES: Record<ResourceLibrarySection, string> = {
  materials: ROUTES.resourceLibraryMaterials,
  labor: ROUTES.resourceLibraryLabor,
  equipment: ROUTES.resourceLibraryEquipment,
  subcontract: ROUTES.resourceLibrarySubcontract,
  suppliers: ROUTES.resourceLibrarySuppliers,
  units: ROUTES.resourceLibraryUnits,
  categories: ROUTES.resourceLibraryCategories,
};

export function ResourceLibraryNav(): React.JSX.Element {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Resource Library"
      className="mb-6 flex flex-wrap gap-2 border-b border-border pb-4"
    >
      {RESOURCE_LIBRARY_SECTIONS.map((section) => {
        const href = SECTION_ROUTES[section];
        const isActive = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={section}
            href={href}
            className={cn(
              'rounded-[10px] px-3 py-2 text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-primary-subtle text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {RESOURCE_LIBRARY_SECTION_LABELS[section]}
          </Link>
        );
      })}
    </nav>
  );
}
