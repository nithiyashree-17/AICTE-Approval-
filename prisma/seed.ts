/**
 * AICTE FlowGuard - Database Seed Script
 * Problem Statement ID: 26262
 *
 * Seeds:
 * 1. 10 Standard System Roles (RBAC)
 * 2. 10 Demo Users (One for each role) for local demonstration and testing
 * 3. Synthetic Demo Institution
 * 4. Sample Rule Versions with APH Provenance
 */

import { PrismaClient, RoleType, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

export const DEMO_USERS = [
  {
    email: 'institution@flowguard.local',
    fullName: 'Delhi Institute of Engineering & Technology (Registrar)',
    role: RoleType.INSTITUTION,
    region: 'NORTH',
  },
  {
    email: 'ro@flowguard.local',
    fullName: 'North Regional Office - Officer In-Charge',
    role: RoleType.REGIONAL_OFFICER,
    region: 'NORTH',
  },
  {
    email: 'bureau@flowguard.local',
    fullName: 'Approval Bureau Officer (HQ)',
    role: RoleType.BUREAU_OFFICER,
    region: 'CENTRAL',
  },
  {
    email: 'scrutiny@flowguard.local',
    fullName: 'Dr. A. K. Sharma (Senior Scrutiny Officer)',
    role: RoleType.SCRUTINY_OFFICER,
    region: 'NORTH',
  },
  {
    email: 'evc_coord@flowguard.local',
    fullName: 'Prof. Ramesh Rao (EVC Regional Coordinator)',
    role: RoleType.EVC_COORDINATOR,
    region: 'NORTH',
  },
  {
    email: 'evc_member@flowguard.local',
    fullName: 'Dr. Sunita Verma (EVC Committee Expert Member)',
    role: RoleType.EVC_MEMBER,
    region: 'NORTH',
  },
  {
    email: 'sac_shc@flowguard.local',
    fullName: 'Justice (Retd.) / Member Convener (SHC/SAC Panel)',
    role: RoleType.SAC_SHC,
    region: 'CENTRAL',
  },
  {
    email: 'authority@flowguard.local',
    fullName: 'Member Secretary / Competent Statutory Authority',
    role: RoleType.COMPETENT_AUTHORITY,
    region: 'CENTRAL',
  },
  {
    email: 'admin@flowguard.local',
    fullName: 'System Administrator (Technical Configuration)',
    role: RoleType.SYSTEM_ADMINISTRATOR,
    region: 'GLOBAL',
  },
  {
    email: 'auditor@flowguard.local',
    fullName: 'Independent Regulatory Auditor (Read-Only)',
    role: RoleType.AUDITOR,
    region: 'GLOBAL',
  },
];

async function main() {
  console.log('Seeding AICTE FlowGuard database...');

  // 1. Seed Roles
  for (const roleName of Object.values(RoleType)) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
        description: `Standard RBAC role for ${roleName}`,
        permissions: {},
      },
    });
  }

  // 2. Seed Synthetic Institution
  const demoInstitution = await prisma.institution.upsert({
    where: { aicteCode: '1-DEMO-2026-ENG' },
    update: {},
    create: {
      aicteCode: '1-DEMO-2026-ENG',
      name: 'Delhi Institute of Technology & Applied Science',
      region: 'NORTH',
      state: 'Delhi',
      address: 'Plot 4, Institutional Area, Sector 6, New Delhi 110070',
      contactEmail: 'contact@ditas-demo.edu.in',
      contactPhone: '+91 11 2345 6789',
    },
  });

  // 3. Seed Users
  for (const u of DEMO_USERS) {
    const userRole = await prisma.role.findUnique({ where: { name: u.role } });
    if (!userRole) continue;

    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        fullName: u.fullName,
        assignedRegion: u.region,
      },
      create: {
        email: u.email,
        fullName: u.fullName,
        passwordHash: '$2b$10$demoHashedPasswordPlaceHolderForLocalDevOnly123',
        status: UserStatus.ACTIVE,
        assignedRegion: u.region,
        institutionId: u.role === RoleType.INSTITUTION ? demoInstitution.id : null,
      },
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId_scopeType_scopeValue: {
          userId: user.id,
          roleId: userRole.id,
          scopeType: u.role === RoleType.INSTITUTION ? 'INSTITUTION' : 'REGION',
          scopeValue: u.role === RoleType.INSTITUTION ? demoInstitution.id : u.region,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: userRole.id,
        scopeType: u.role === RoleType.INSTITUTION ? 'INSTITUTION' : 'REGION',
        scopeValue: u.role === RoleType.INSTITUTION ? demoInstitution.id : u.region,
      },
    });
  }

  console.log(`Database seeded with ${DEMO_USERS.length} demo accounts.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
