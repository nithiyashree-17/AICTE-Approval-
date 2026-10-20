/**
 * @flowguard/shared
 * Single source of truth for Role enums, landing routes, and navigation configs.
 */

export enum RoleType {
  INSTITUTION = 'INSTITUTION',
  SCRUTINY_OFFICER = 'SCRUTINY_OFFICER',
  REGIONAL_OFFICER = 'REGIONAL_OFFICER',
  BUREAU_OFFICER = 'BUREAU_OFFICER',
  EVC_COORDINATOR = 'EVC_COORDINATOR',
  EVC_MEMBER = 'EVC_MEMBER',
  SAC_SHC = 'SAC_SHC',
  COMPETENT_AUTHORITY = 'COMPETENT_AUTHORITY',
  SYSTEM_ADMINISTRATOR = 'SYSTEM_ADMINISTRATOR',
  AUDITOR = 'AUDITOR',
}

/**
 * Role to Landing Route Map as required by Spec Section 3
 */
export const ROLE_LANDING_ROUTES: Record<RoleType, string> = {
  [RoleType.INSTITUTION]: '/institution/dashboard',
  [RoleType.SCRUTINY_OFFICER]: '/scrutiny/dashboard',
  [RoleType.REGIONAL_OFFICER]: '/regional/dashboard',
  [RoleType.BUREAU_OFFICER]: '/bureau/dashboard',
  [RoleType.EVC_COORDINATOR]: '/evc/dashboard',
  [RoleType.EVC_MEMBER]: '/evc-member/my-visits',
  [RoleType.SAC_SHC]: '/committee/agenda',
  [RoleType.COMPETENT_AUTHORITY]: '/authority/overview',
  [RoleType.SYSTEM_ADMINISTRATOR]: '/admin/dashboard',
  [RoleType.AUDITOR]: '/admin/dashboard', // Read-only fallback
};

export const ROLE_LABELS: Record<RoleType, string> = {
  [RoleType.INSTITUTION]: 'Institution (Applicant)',
  [RoleType.SCRUTINY_OFFICER]: 'Scrutiny Officer',
  [RoleType.REGIONAL_OFFICER]: 'Regional Officer',
  [RoleType.BUREAU_OFFICER]: 'Bureau Officer',
  [RoleType.EVC_COORDINATOR]: 'EVC Coordinator',
  [RoleType.EVC_MEMBER]: 'EVC Member',
  [RoleType.SAC_SHC]: 'SAC / SHC Committee Member',
  [RoleType.COMPETENT_AUTHORITY]: 'Competent Authority',
  [RoleType.SYSTEM_ADMINISTRATOR]: 'System Administrator',
  [RoleType.AUDITOR]: 'Auditor (Read-Only)',
};

/**
 * Helper to get the canonical landing route for a role string
 */
export function getRoleLandingRoute(role?: string): string {
  if (!role) return '/login';
  const r = role.toUpperCase() as RoleType;
  return ROLE_LANDING_ROUTES[r] || '/login';
}

/**
 * Route to allowed roles mapping
 */
export const ROUTE_ALLOWED_ROLES: Record<string, RoleType[]> = {
  '/institution': [RoleType.INSTITUTION],
  '/scrutiny': [RoleType.SCRUTINY_OFFICER],
  '/regional': [RoleType.REGIONAL_OFFICER],
  '/bureau': [RoleType.BUREAU_OFFICER],
  '/evc': [RoleType.EVC_COORDINATOR],
  '/evc-member': [RoleType.EVC_MEMBER],
  '/committee': [RoleType.SAC_SHC],
  '/authority': [RoleType.COMPETENT_AUTHORITY],
  '/admin': [RoleType.SYSTEM_ADMINISTRATOR, RoleType.AUDITOR],
};

/**
 * Check if a role is permitted to access a given path
 */
export function isRouteAllowedForRole(pathname: string, role?: string): boolean {
  if (!role) return false;
  const r = role.toUpperCase() as RoleType;

  // Root segments
  for (const [prefix, allowedRoles] of Object.entries(ROUTE_ALLOWED_ROLES)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      return allowedRoles.includes(r);
    }
  }

  // Public/shared routes allowed
  return true;
}
