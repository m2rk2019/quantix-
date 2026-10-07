import {
  APP_VERSION,
  MEGAWIDE_COPYRIGHT_LINE,
  MEGAWIDE_LOGO_ASPECT,
  MEGAWIDE_RIGHTS_LINE,
} from '@/lib/branding';
import { cn } from '@/lib/utils';

interface MegawideFooterProps {
  collapsed?: boolean;
  className?: string;
}

/** Former logo slot heights — keep footer height stable after logo removal. */
function logoSlotHeight(collapsed: boolean): number {
  const width = collapsed ? 56 : 150;
  return Math.round(width / MEGAWIDE_LOGO_ASPECT);
}

export function MegawideFooter({
  collapsed = false,
  className,
}: MegawideFooterProps): React.JSX.Element {
  const slotHeight = logoSlotHeight(collapsed);

  return (
    <footer
      className={cn(
        'bg-background p-5 transition-all duration-200',
        className
      )}
    >
      <div className={cn(collapsed ? 'flex justify-center' : 'text-left')}>
        <div
          aria-hidden
          className={collapsed ? 'mx-auto w-[56px]' : 'w-[150px] max-w-full'}
          style={{ height: slotHeight }}
        />
        {!collapsed && (
          <p className="mt-3 text-xs leading-relaxed text-[#6B7280]">
            {MEGAWIDE_COPYRIGHT_LINE}
            <br />
            {MEGAWIDE_RIGHTS_LINE}
            <br />
            {APP_VERSION}
          </p>
        )}
      </div>
    </footer>
  );
}
