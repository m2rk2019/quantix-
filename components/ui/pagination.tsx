import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  baseUrl: string;
  searchParams: Record<string, string | undefined>;
  className?: string;
}

function buildPageUrl(
  baseUrl: string,
  page: number,
  searchParams: Record<string, string | undefined>
): string {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  params.set('page', String(page));
  const query = params.toString();
  return query ? `${baseUrl}?${query}` : baseUrl;
}

export function Pagination({
  page,
  totalPages,
  baseUrl,
  searchParams,
  className,
}: PaginationProps): React.JSX.Element | null {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div
      className={cn('flex items-center justify-between gap-4 pt-4', className)}
    >
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Button asChild variant="outline" size="sm">
            <Link
              href={buildPageUrl(baseUrl, page - 1, searchParams)}
            >
              Previous
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
        )}
        {page < totalPages ? (
          <Button asChild variant="outline" size="sm">
            <Link
              href={buildPageUrl(baseUrl, page + 1, searchParams)}
            >
              Next
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
