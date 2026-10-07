import { PageTitle } from '@/components/layout/PageTitle';
import { ResourceLibraryNav } from '@/features/resource-library/components/ResourceLibraryNav';
import { getAuthUser } from '@/lib/auth/session';
import { canManageCompanyResources } from '@/lib/auth/permissions';

export const dynamic = 'force-dynamic';

export default async function ResourceLibraryLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.JSX.Element> {
  const { profile } = await getAuthUser();
  const canEdit = profile ? canManageCompanyResources(profile.role) : false;

  return (
    <div>
      <PageTitle title="Resource Library" />
      <p className="mb-2 text-sm text-muted-foreground">
        Company master cost database for materials, labor, equipment, subcontractors,
        suppliers, units, and categories.
      </p>
      {!canEdit && (
        <p className="mb-4 text-sm text-amber-700">
          Read-only access. Contact an administrator to manage company resources.
        </p>
      )}
      <ResourceLibraryNav />
      {children}
    </div>
  );
}
