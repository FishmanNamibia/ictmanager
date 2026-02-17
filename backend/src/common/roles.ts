/**
 * I-ICTMS Role definitions — RBAC
 * Align with frontend and audit.
 */
export enum Role {
  ICT_MANAGER = 'ict_manager',
  ICT_STAFF = 'ict_staff',
  BUSINESS_MANAGER = 'business_manager',
  EXECUTIVE = 'executive',
  AUDITOR = 'auditor',
  VENDOR = 'vendor',
}

export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.ICT_MANAGER]: 100,
  [Role.ICT_STAFF]: 80,
  [Role.BUSINESS_MANAGER]: 60,
  [Role.EXECUTIVE]: 40,
  [Role.AUDITOR]: 30,
  [Role.VENDOR]: 10,
};

export function hasMinimumRole(userRole: Role, required: Role): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[required] ?? 0);
}
