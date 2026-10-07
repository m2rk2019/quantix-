import { MegawideLogo } from '@/components/branding/MegawideLogo';
import { QuantixLogo } from '@/components/branding/QuantixLogo';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function ShellLoading(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted/30">
      <QuantixLogo variant="full" width={240} />
      <LoadingSpinner label="Checking authentication" size="lg" />
      <MegawideLogo />
    </div>
  );
}
