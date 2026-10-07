import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants/routes';

export default function NotFoundPage(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="max-w-md text-muted-foreground">
        The page you requested does not exist or you may not have access to it.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href={ROUTES.dashboard}>Return to Dashboard</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={ROUTES.projects}>View Projects</Link>
        </Button>
      </div>
    </div>
  );
}
