'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { QuantixLogo } from '@/components/branding/QuantixLogo';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { UserMenu } from '@/components/layout/UserMenu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/types/auth';

interface HeaderProps {
  user: UserProfile;
}

export function Header({ user }: HeaderProps): React.JSX.Element {
  const { theme, setTheme } = useTheme();

  return (
    <header
      className={cn(
        'flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-background pl-14 pr-4 shadow-sm md:pl-6 md:pr-6'
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <QuantixLogo size={28} className="hidden shrink-0 md:block" />
        <Breadcrumb />
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <UserMenu user={user} />
      </div>
    </header>
  );
}
