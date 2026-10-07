export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'estimator'
  | 'quantity_surveyor'
  | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
}

export const USER_ROLES: readonly UserRole[] = [
  'super_admin',
  'admin',
  'estimator',
  'quantity_surveyor',
  'viewer',
] as const;

export function isUserRole(value: string): value is UserRole {
  return (USER_ROLES as readonly string[]).includes(value);
}
