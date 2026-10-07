import type { ReactNode } from 'react';

import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import type { UserProfile } from '@/types/auth';
import type { CompanySettings } from '@/types/company-settings';

interface AppShellProps {
  children: ReactNode;
  user: UserProfile;
  company: CompanySettings;
}

export function AppShell({ children, user }: AppShellProps): React.JSX.Element {
  return (
    <div className="flex min-h-screen bg-muted/30">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:shadow"
      >
        Skip to main content
      </a>
      <Sidebar user={user} />
      <div className="flex min-h-screen flex-1 flex-col md:pl-0">
        <Header user={user} />
        <main id="main-content" className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
