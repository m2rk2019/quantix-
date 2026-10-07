'use client';

import { HelpCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

interface SidebarHelpSupportProps {
  collapsed?: boolean;
}

export function SidebarHelpSupport({
  collapsed = false,
}: SidebarHelpSupportProps): React.JSX.Element {
  return (
    <a
      href="mailto:support@megawide.com.ph"
      className={cn(
        'mb-1 flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-all duration-200 hover:bg-muted hover:text-foreground',
        collapsed && 'justify-center px-2'
      )}
      title="Help & Support"
    >
      <HelpCircle className="h-5 w-5 shrink-0 text-muted-foreground" />
      {!collapsed && <span>Help &amp; Support</span>}
    </a>
  );
}
