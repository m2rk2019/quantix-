import { Suspense } from 'react';

import { LoginForm } from '@/features/auth/components/LoginForm';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function LoginPage(): React.JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Suspense
        fallback={
          <LoadingSpinner label="Loading login" className="min-h-[320px]" />
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
