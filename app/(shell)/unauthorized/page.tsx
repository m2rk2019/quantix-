import Link from 'next/link';

import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants/routes';

export default function UnauthorizedPage(): React.JSX.Element {
  return (
    <PageContainer>
      <div className="mx-auto flex max-w-lg flex-col items-center py-16 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          403
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Unauthorized
        </h1>
        <p className="mt-3 text-muted-foreground">
          You do not have permission to access this page. Contact your
          administrator if you believe this is an error.
        </p>
        <div className="mt-8 flex gap-3">
          <Button asChild variant="outline">
            <Link href={ROUTES.dashboard}>Go to Dashboard</Link>
          </Button>
          <Button asChild>
            <Link href={ROUTES.projects}>View Projects</Link>
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
