'use client';

import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { LogOut } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ROLE_LABELS } from '@/lib/auth/permissions';
import { signOut } from '@/services/auth/sign-out';
import type { UserProfile } from '@/types/auth';

function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

interface UserMenuProps {
  user: UserProfile;
}

export function UserMenu({ user }: UserMenuProps): React.JSX.Element {
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  async function handleSignOut(): Promise<void> {
    setIsSigningOut(true);
    await signOut();
  }

  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 gap-2 px-2"
          aria-label="Open user menu"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            {getInitials(user.full_name)}
          </span>
          <span className="hidden max-w-[120px] truncate text-sm font-medium md:inline">
            {user.full_name}
          </span>
        </Button>
      </DropdownMenuPrimitive.Trigger>

      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          className="z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          align="end"
          sideOffset={8}
        >
          <div className="px-2 py-2">
            <p className="text-sm font-medium">{user.full_name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            <div className="mt-2">
              <Badge variant={user.role}>{ROLE_LABELS[user.role]}</Badge>
            </div>
          </div>

          <DropdownMenuPrimitive.Separator className="my-1 h-px bg-border" />

          <DropdownMenuPrimitive.Item
            className="relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            disabled={isSigningOut}
            onSelect={(event) => {
              event.preventDefault();
              void handleSignOut();
            }}
          >
            <LogOut className="h-4 w-4" />
            {isSigningOut ? 'Signing out…' : 'Sign out'}
          </DropdownMenuPrimitive.Item>
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}
