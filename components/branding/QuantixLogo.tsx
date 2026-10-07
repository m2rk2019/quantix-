import {
  COMPANY_NAME,
  LOGO_LOCKUP_ASPECT,
  LOGO_MARK_PATH,
  LOGO_MARK_PNG_2X_PATH,
  LOGO_MARK_PNG_PATH,
  LOGO_PATH,
  LOGO_PNG_2X_PATH,
  LOGO_PNG_PATH,
  TAGLINE,
} from '@/lib/branding';
import { cn } from '@/lib/utils';

type QuantixLogoVariant = 'mark' | 'full';

interface QuantixLogoProps {
  /** `mark` — icon only; `full` — wordmark + subtitle lockup */
  variant?: QuantixLogoVariant;
  /** Square size for `mark` variant (px) */
  size?: number;
  /** Width for `full` lockup (px); height scales from aspect ratio */
  width?: number;
  className?: string;
}

export function QuantixLogo({
  variant = 'mark',
  size = 40,
  width = 220,
  className,
}: QuantixLogoProps): React.JSX.Element {
  const isFull = variant === 'full';
  const svgSrc = isFull ? LOGO_PATH : LOGO_MARK_PATH;
  const pngSrc = isFull ? LOGO_PNG_PATH : LOGO_MARK_PNG_PATH;
  const png2xSrc = isFull ? LOGO_PNG_2X_PATH : LOGO_MARK_PNG_2X_PATH;
  const imgWidth = isFull ? width : size;
  const imgHeight = isFull ? Math.round(width / LOGO_LOCKUP_ASPECT) : size;

  return (
    <picture>
      <source srcSet={svgSrc} type="image/svg+xml" />
      <img
        src={pngSrc}
        srcSet={`${pngSrc} 1x, ${png2xSrc} 2x`}
        alt={`${COMPANY_NAME} — ${TAGLINE}`}
        width={imgWidth}
        height={imgHeight}
        className={cn(
          'shrink-0 object-contain',
          isFull ? 'h-auto max-w-full' : 'size-auto',
          className
        )}
        decoding="async"
      />
    </picture>
  );
}
