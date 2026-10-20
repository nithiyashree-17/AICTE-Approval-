import { getRoleLandingRoute, ROLE_LABELS, RoleType } from '@flowguard/shared';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  primaryRole: string;
  roles?: string[];
  institutionId?: string | null;
  institutionName?: string | null;
  assignedRegion?: string | null;
  designation?: string | null;
}

export function getRoleHomeDashboard(role?: string): string {
  return getRoleLandingRoute(role);
}

export function getRoleLabel(role?: string): string {
  if (!role) return 'Public User';
  const normalized = role.toUpperCase() as RoleType;
  return ROLE_LABELS[normalized] || role;
}

const BASE_PROFILES: Record<string, AuthUser> = {
  INSTITUTION: {
    id: 'demo-inst-1',
    email: 'institution@flowguard.local',
    fullName: 'Delhi Institute of Engineering & Technology (Registrar)',
    role: 'INSTITUTION',
    primaryRole: 'INSTITUTION',
    roles: ['INSTITUTION'],
    institutionId: 'inst-1',
    institutionName: 'Delhi Institute of Engineering & Technology',
    assignedRegion: 'NORTH',
    designation: 'Registrar',
  },
  SCRUTINY_OFFICER: {
    id: 'demo-scrutiny-1',
    email: 'scrutiny@flowguard.local',
    fullName: 'Dr. A. K. Sharma',
    role: 'SCRUTINY_OFFICER',
    primaryRole: 'SCRUTINY_OFFICER',
    roles: ['SCRUTINY_OFFICER'],
    assignedRegion: 'NORTH',
    designation: 'Senior Scrutiny Officer',
  },
  REGIONAL_OFFICER: {
    id: 'demo-ro-1',
    email: 'ro@flowguard.local',
    fullName: 'Dr. R. K. Singhania',
    role: 'REGIONAL_OFFICER',
    primaryRole: 'REGIONAL_OFFICER',
    roles: ['REGIONAL_OFFICER'],
    assignedRegion: 'NORTH',
    designation: 'Regional Officer In-Charge',
  },
  BUREAU_OFFICER: {
    id: 'demo-bureau-1',
    email: 'bureau@flowguard.local',
    fullName: 'Shri Vikram Malhotra',
    role: 'BUREAU_OFFICER',
    primaryRole: 'BUREAU_OFFICER',
    roles: ['BUREAU_OFFICER'],
    assignedRegion: 'CENTRAL',
    designation: 'Approval Bureau Officer (HQ)',
  },
  EVC_COORDINATOR: {
    id: 'demo-evc-coord-1',
    email: 'evc_coord@flowguard.local',
    fullName: 'Prof. Ramesh Rao',
    role: 'EVC_COORDINATOR',
    primaryRole: 'EVC_COORDINATOR',
    roles: ['EVC_COORDINATOR'],
    assignedRegion: 'NORTH',
    designation: 'EVC Regional Coordinator',
  },
  EVC_MEMBER: {
    id: 'demo-evc-member-1',
    email: 'evc_member@flowguard.local',
    fullName: 'Dr. Sunita Verma',
    role: 'EVC_MEMBER',
    primaryRole: 'EVC_MEMBER',
    roles: ['EVC_MEMBER'],
    assignedRegion: 'NORTH',
    designation: 'EVC Expert Committee Member',
  },
  COMMITTEE_MEMBER: {
    id: 'demo-committee-1',
    email: 'committee@flowguard.local',
    fullName: 'Justice (Retd.) / Member Convener',
    role: 'COMMITTEE_MEMBER',
    primaryRole: 'COMMITTEE_MEMBER',
    roles: ['COMMITTEE_MEMBER', 'SAC_SHC'],
    assignedRegion: 'CENTRAL',
    designation: 'SHC/SAC Panel Member',
  },
  AUTHORITY: {
    id: 'demo-authority-1',
    email: 'authority@flowguard.local',
    fullName: 'Prof. T. G. Sitharam (Member Secretary Nominee)',
    role: 'AUTHORITY',
    primaryRole: 'AUTHORITY',
    roles: ['AUTHORITY', 'COMPETENT_AUTHORITY'],
    assignedRegion: 'HQ_ALL',
    designation: 'Competent Authority',
  },
  SYSTEM_ADMINISTRATOR: {
    id: 'demo-admin-1',
    email: 'admin@flowguard.local',
    fullName: 'System Administrator (Audit In-Charge)',
    role: 'SYSTEM_ADMINISTRATOR',
    primaryRole: 'SYSTEM_ADMINISTRATOR',
    roles: ['SYSTEM_ADMINISTRATOR', 'AUDITOR'],
    assignedRegion: 'HQ_ALL',
    designation: 'Apex Platform Administrator',
  },
};

export const DEMO_PROFILES: Record<string, AuthUser> = {
  ...BASE_PROFILES,
  // Aliases for intuitive matching
  ADMIN: BASE_PROFILES.SYSTEM_ADMINISTRATOR,
  AUDITOR: BASE_PROFILES.SYSTEM_ADMINISTRATOR,
  COMPETENT_AUTHORITY: BASE_PROFILES.AUTHORITY,
  SAC_SHC: BASE_PROFILES.COMMITTEE_MEMBER,
  OFFICER: BASE_PROFILES.SCRUTINY_OFFICER,
};
