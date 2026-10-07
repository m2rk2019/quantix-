'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Archive,
  ClipboardCheck,
  Database,
  FolderKanban,
  LayoutDashboard,
  LayoutTemplate,
  Library,
  LineChart,
  Menu,
  PanelLeft,
  PanelLeftClose,
  Settings,
} from 'lucide-react';
import { useState } from 'react';

import { MegawideFooter } from '@/components/branding/MegawideFooter';
import { QuantixLogo } from '@/components/branding/QuantixLogo';
import { SidebarHelpSupport } from '@/components/layout/SidebarHelpSupport';
import { SidebarUserProfile } from '@/components/layout/SidebarUserProfile';
import { Button } from '@/components/ui/button';
import { COMPANY_NAME, TAGLINE } from '@/lib/branding';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';
import { isAdminOrAbove } from '@/lib/auth/permissions';

import type { UserProfile } from '@/types/auth';

const BASE_NAV = [
  { label: 'Dashboard', href: ROUTES.dashboard, icon: LayoutDashboard },
  { label: 'Projects', href: ROUTES.projects, icon: FolderKanban },
  { label: 'Templates', href: ROUTES.masterTemplates, icon: LayoutTemplate },
  { label: 'Historical', href: ROUTES.historical, icon: Archive },
  { label: 'Resource Library', href: ROUTES.resourceLibraryMaterials, icon: Library },
] as const;

interface SidebarProps {
  user: UserProfile;
}

export function Sidebar({ user }: SidebarProps): React.JSX.Element {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    ...BASE_NAV,
    ...(isAdminOrAbove(user.role)
      ? [
          { label: 'Company Settings', href: ROUTES.adminSettings, icon: Settings },
          { label: 'Benchmarks', href: ROUTES.adminBenchmarks, icon: LineChart },
          { label: 'UAT Suite', href: ROUTES.adminUat, icon: ClipboardCheck },
          { label: 'Pilot Demo', href: ROUTES.adminDemo, icon: Database },
        ]
      : []),
  ];

  const navContent = (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          'flex min-h-14 shrink-0 items-center border-b border-sidebar-border px-4 py-3 transition-all duration-200',
          collapsed ? 'flex-col justify-center gap-2' : 'justify-between'
        )}
      >
        {!collapsed ? (
          <Link href={ROUTES.dashboard} className="flex min-w-0 flex-1 items-center gap-3">
            <QuantixLogo size={36} />
            <div className="min-w-0">
              <p className="truncate text-base font-bold tracking-tight text-foreground">
                {COMPANY_NAME}
              </p>
              <p className="truncate text-xs text-muted-foreground">{TAGLINE}</p>
            </div>
          </Link>
        ) : (
          <Link href={ROUTES.dashboard} aria-label={COMPANY_NAME}>
            <QuantixLogo size={32} />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="hidden shrink-0 md:inline-flex"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === ROUTES.resourceLibraryMaterials
              ? pathname.startsWith('/admin/resource-library')
              : href === ROUTES.masterTemplates
                ? pathname.startsWith('/templates')
              : href === ROUTES.historical
                ? pathname.startsWith('/historical')
              : href === ROUTES.projects
                ? pathname === '/projects' ||
                  pathname.startsWith('/projects/')
              : href === ROUTES.adminSettings
                ? pathname.startsWith('/admin/settings')
                : href === ROUTES.adminBenchmarks
                  ? pathname.startsWith('/admin/benchmarks')
                  : href === ROUTES.adminUat
                    ? pathname.startsWith('/admin/uat')
                    : href === ROUTES.adminDemo
                      ? pathname.startsWith('/admin/demo')
                      : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-active text-primary'
                  : 'text-sidebar-foreground hover:bg-muted hover:text-foreground',
                collapsed && 'justify-center px-2'
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r bg-primary" />
              )}
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0 transition-colors duration-200',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto shrink-0 transition-all duration-200">
        <div className="space-y-1 px-3 py-2">
          <SidebarHelpSupport collapsed={collapsed} />
          <SidebarUserProfile user={user} collapsed={collapsed} />
        </div>

        <div className="border-t border-[#E5E7EB] bg-background">
          <MegawideFooter collapsed={collapsed} />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed left-4 top-3 z-40 md:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 md:hidden"
          aria-label="Close navigation overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm transition-all duration-200 md:static md:translate-x-0',
          collapsed && 'md:w-16',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {navContent}
      </aside>
    </>
  );
}
