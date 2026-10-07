import {
  MEGAWIDE_LOGO_2X_PATH,
  MEGAWIDE_LOGO_ASPECT,
  MEGAWIDE_LOGO_PATH,
  POWERED_BY,
} from '@/lib/branding';
import { cn } from '@/lib/utils';

interface MegawideLogoProps {
  collapsed?: boolean;
  className?: string;
}

export function MegawideLogo({
  collapsed = false,
  className,
}: MegawideLogoProps): React.JSX.Element {
  const width = collapsed ? 56 : 150;
  const height = Math.round(width / MEGAWIDE_LOGO_ASPECT);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={MEGAWIDE_LOGO_PATH}
      srcSet={`${MEGAWIDE_LOGO_PATH} 1x, ${MEGAWIDE_LOGO_2X_PATH} 2x`}
      alt={POWERED_BY}
      width={width}
      height={height}
      className={cn(
        collapsed
          ? 'mx-auto h-auto max-w-[56px] object-contain'
          : 'h-auto w-[150px] max-w-full object-contain object-left',
        className
      )}
      decoding="async"
    />
  );
}
