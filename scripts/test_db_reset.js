const { PrismaClient } = require('@prisma/client');
const bcrypt = require('../apps/api/node_modules/bcrypt');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const user = process.env.DB_USER || 'postgres';
const pass = process.env.DB_PASSWORD ? encodeURIComponent(process.env.DB_PASSWORD) : 'postgres';
const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || '5432';
const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ||
  `postgresql://${user}:${pass}@${host}:${port}/flowguard_test?schema=public`;

async function resetTestDatabase() {
  console.log(`[Test DB Reset] Connecting to: ${TEST_DB_URL}`);
  const prisma = new PrismaClient({
    datasources: { db: { url: TEST_DB_URL } },
  });

  try {
    // 1. Clean all dynamic data tables in public schema
    console.log('[Test DB Reset] Dynamically truncating tables...');
    await prisma.$executeRawUnsafe(`
      DO $$ DECLARE
          r RECORD;
      BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations') LOOP
              EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
          END LOOP;
      END $$;
    `);

    // 2. Run seed logic
    console.log('[Test DB Reset] Seeding standard roles and demo users...');
    const ROLES = [
      'INSTITUTION',
      'REGIONAL_OFFICER',
      'BUREAU_OFFICER',
      'SCRUTINY_OFFICER',
      'EVC_COORDINATOR',
      'EVC_MEMBER',
      'SAC_SHC',
      'COMPETENT_AUTHORITY',
      'SYSTEM_ADMINISTRATOR',
      'AUDITOR',
    ];

    const roleMap = {};
    for (const r of ROLES) {
      const createdRole = await prisma.role.create({
        data: {
          name: r,
          description: `RBAC role ${r}`,
          permissions: {},
        },
      });
      roleMap[r] = createdRole.id;
    }

    // Default Institution
    const demoInst = await prisma.institution.create({
      data: {
        id: 'inst-demo-uuid',
        aicteCode: '1-NORTH-DEMO-001',
        name: 'Delhi Institute of Engineering & Technology',
        type: 'ENGINEERING',
        region: 'NORTH',
        state: 'Delhi',
        address: 'Institutional Area, Sector 62, New Delhi',
        contactEmail: 'institution@flowguard.local',
        contactPhone: '+91 98765 43210',
        status: 'ACTIVE',
        isDemo: true,
      },
    });

    const passwordHash = await bcrypt.hash('Password123!', 10);

    const DEMO_USERS = [
      {
        email: 'institution@flowguard.local',
        fullName: 'Delhi Institute of Engineering & Technology (Registrar)',
        role: 'INSTITUTION',
        region: 'NORTH',
        institutionId: demoInst.id,
      },
      {
        email: 'ro@flowguard.local',
        fullName: 'North Regional Office - Officer In-Charge',
        role: 'REGIONAL_OFFICER',
        region: 'NORTH',
      },
      {
        email: 'bureau@flowguard.local',
        fullName: 'Approval Bureau Officer (HQ)',
        role: 'BUREAU_OFFICER',
        region: 'CENTRAL',
      },
      {
        email: 'scrutiny@flowguard.local',
        fullName: 'Dr. A. K. Sharma (Senior Scrutiny Officer)',
        role: 'SCRUTINY_OFFICER',
        region: 'NORTH',
      },
      {
        email: 'evc_coord@flowguard.local',
        fullName: 'Prof. Ramesh Rao (EVC Regional Coordinator)',
        role: 'EVC_COORDINATOR',
        region: 'NORTH',
      },
      {
        email: 'evc_member@flowguard.local',
        fullName: 'Dr. Sunita Verma (EVC Committee Expert Member)',
        role: 'EVC_MEMBER',
        region: 'NORTH',
      },
      {
        email: 'sac_shc@flowguard.local',
        fullName: 'Justice (Retd.) / Member Convener (SHC/SAC Panel)',
        role: 'SAC_SHC',
        region: 'CENTRAL',
      },
      {
        email: 'authority@flowguard.local',
        fullName: 'Member Secretary / Competent Statutory Authority',
        role: 'COMPETENT_AUTHORITY',
        region: 'CENTRAL',
      },
      {
        email: 'admin@flowguard.local',
        fullName: 'System Administrator (Technical Configuration)',
        role: 'SYSTEM_ADMINISTRATOR',
        region: 'GLOBAL',
      },
      {
        email: 'auditor@flowguard.local',
        fullName: 'Independent Regulatory Auditor (Read-Only)',
        role: 'AUDITOR',
        region: 'GLOBAL',
      },
    ];

    for (const u of DEMO_USERS) {
      await prisma.user.create({
        data: {
          email: u.email,
          fullName: u.fullName,
          passwordHash,
          status: 'ACTIVE',
          assignedRegion: u.region,
          institutionId: u.institutionId || null,
          isDemo: true,
          roles: {
            create: {
              roleId: roleMap[u.role],
              scopeType: u.role === 'INSTITUTION' ? 'INSTITUTION' : 'REGIONAL',
              scopeValue: u.institutionId || u.region,
            },
          },
        },
      });
    }

    // 3. Load Fixtures
    console.log('[Test DB Reset] Loading test fixtures...');
    const instFixtures = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../tests/fixtures/test-institutions.json'), 'utf8')
    );
    for (const inst of instFixtures) {
      await prisma.institution.create({ data: inst });
    }

    const userFixtures = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../tests/fixtures/test-users.json'), 'utf8')
    );
    for (const u of userFixtures) {
      await prisma.user.create({
        data: {
          id: u.id,
          email: u.email,
          fullName: u.fullName,
          passwordHash,
          status: 'ACTIVE',
          assignedRegion: u.assignedRegion,
          institutionId: u.institutionId,
          designation: u.designation,
          phone: u.phone,
          roles: {
            create: {
              roleId: roleMap[u.role],
              scopeType: 'INSTITUTION',
              scopeValue: u.institutionId,
            },
          },
        },
      });
    }

    const appFixtures = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../tests/fixtures/test-applications.json'), 'utf8')
    );
    for (const app of appFixtures) {
      await prisma.application.create({ data: app });
    }

    console.log('[Test DB Reset] Successfully reset and seeded flowguard_test!');
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  resetTestDatabase().catch((err) => {
    console.error('Reset failed:', err);
    process.exit(1);
  });
}

module.exports = { resetTestDatabase };
