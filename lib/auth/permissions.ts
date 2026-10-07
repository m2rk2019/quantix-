import type { UserRole } from '@/types/auth';
import { canCreateProjectRole } from '@/types/project';

export const ROLE_LABELS: Record<UserRole, string> = {  super_admin: 'Super Admin',
  admin: 'Admin',
  estimator: 'Estimator',
  quantity_surveyor: 'Quantity Surveyor',
  viewer: 'Viewer',
};

/** Sprint 2: only Admin and Estimator (plus Super Admin) may create projects. */
export function canCreateProject(role: UserRole): boolean {
  return canCreateProjectRole(role);
}
export function canAccessRoute(role: UserRole, pathname: string): boolean {
  if (
    pathname === '/projects/new' ||
    pathname.startsWith('/projects/new/') ||
    pathname === '/projects/import' ||
    pathname.startsWith('/projects/import/') ||
    pathname === '/templates' ||
    pathname.startsWith('/templates/')
  ) {
    return canCreateProject(role);
  }

  if (pathname.startsWith('/admin/settings')) {
    return isAdminOrAbove(role);
  }

  if (pathname.startsWith('/admin/benchmarks')) {
    return isAdminOrAbove(role);
  }

  if (pathname.startsWith('/admin/uat')) {
    return isAdminOrAbove(role);
  }

  if (pathname.startsWith('/admin/demo')) {
    return isAdminOrAbove(role);
  }

  return true;
}

export function isAdminOrAbove(role: UserRole): boolean {
  return role === 'super_admin' || role === 'admin';
}

export function canManageUsers(role: UserRole): boolean {
  return isAdminOrAbove(role);
}

/** Company resource library: Super Admin and Admin may create/update/delete. */
export function canManageCompanyResources(role: UserRole): boolean {
  return isAdminOrAbove(role);
}

/** Company profile and branding settings. */
export function canManageCompanySettings(role: UserRole): boolean {
  return isAdminOrAbove(role);
}

/** All authenticated roles may browse the company resource library. */
export function canViewCompanyResources(role: UserRole): boolean {
  return Boolean(role);
}

/** Estimators and QS may use resources in rate analysis; viewers are read-only. */
export function canUseCompanyResources(role: UserRole): boolean {
  return role !== 'viewer';
}

/** Admin and Estimator may edit estimate markup percentages on the summary page. */
export function canEditEstimateMarkups(role: UserRole): boolean {
  return (
    role === 'super_admin' || role === 'admin' || role === 'estimator'
  );
}

/** All authenticated roles may browse the Historical Projects repository. */
export function canViewHistoricalProjects(role: UserRole): boolean {
  return Boolean(role);
}

/** All roles except viewer may use the AI Estimator copilot. */
export function canUseAiEstimator(role: UserRole): boolean {
  return role !== 'viewer';
}
