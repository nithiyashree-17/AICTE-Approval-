import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { ScopeService } from './scope.service';

describe('Data Scoping Verification (TDD)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let scopeService: ScopeService;

  let instAUser: any;
  let instBUser: any;
  let appA: any;
  let appB: any;
  let roNorthUser: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    scopeService = app.get(ScopeService);

    // Setup Test Data
    const instRole = await prisma.role.findUnique({ where: { name: 'INSTITUTION' } });
    const roRole = await prisma.role.findUnique({ where: { name: 'REGIONAL_OFFICER' } });

    // Institution A
    const instA = await prisma.institution.upsert({
      where: { aicteCode: 'TEST-INST-A' },
      update: {},
      create: {
        aicteCode: 'TEST-INST-A',
        name: 'Test College Alpha',
        region: 'NORTH',
        state: 'Delhi',
        address: 'Delhi Sector 1',
        contactEmail: 'alpha@test.edu',
        contactPhone: '9999999901',
      },
    });

    instAUser = await prisma.user.upsert({
      where: { email: 'user-a@test.edu' },
      update: { institutionId: instA.id },
      create: {
        email: 'user-a@test.edu',
        fullName: 'Officer Alpha',
        passwordHash: 'dummy',
        status: 'ACTIVE',
        assignedRegion: 'NORTH',
        institutionId: instA.id,
      },
    });

    const existingRoleA = await prisma.userRole.findFirst({
      where: { userId: instAUser.id, roleId: instRole!.id },
    });
    if (!existingRoleA) {
      await prisma.userRole.create({
        data: {
          userId: instAUser.id,
          roleId: instRole!.id,
          scopeType: 'INSTITUTION',
          scopeValue: instA.id,
        },
      });
    }

    // Institution B
    const instB = await prisma.institution.upsert({
      where: { aicteCode: 'TEST-INST-B' },
      update: {},
      create: {
        aicteCode: 'TEST-INST-B',
        name: 'Test College Beta',
        region: 'SOUTH',
        state: 'Karnataka',
        address: 'Bangalore Road',
        contactEmail: 'beta@test.edu',
        contactPhone: '9999999902',
      },
    });

    instBUser = await prisma.user.upsert({
      where: { email: 'user-b@test.edu' },
      update: { institutionId: instB.id },
      create: {
        email: 'user-b@test.edu',
        fullName: 'Officer Beta',
        passwordHash: 'dummy',
        status: 'ACTIVE',
        assignedRegion: 'SOUTH',
        institutionId: instB.id,
      },
    });

    const existingRoleB = await prisma.userRole.findFirst({
      where: { userId: instBUser.id, roleId: instRole!.id },
    });
    if (!existingRoleB) {
      await prisma.userRole.create({
        data: {
          userId: instBUser.id,
          roleId: instRole!.id,
          scopeType: 'INSTITUTION',
          scopeValue: instB.id,
        },
      });
    }

    // Applications for A and B
    appA = await prisma.application.upsert({
      where: { applicationNumber: 'TEST-APP-ALPHA-01' },
      update: {},
      create: {
        applicationNumber: 'TEST-APP-ALPHA-01',
        institutionId: instA.id,
        type: 'NEW_INSTITUTION_LOA',
        academicYear: '2026-2027',
        currentState: 'DRAFT',
        workflowDefinitionKey: 'NEW_INSTITUTION_LOA_V1',
        workflowVersion: 1,
        assignedRegion: 'NORTH',
      },
    });

    appB = await prisma.application.upsert({
      where: { applicationNumber: 'TEST-APP-BETA-02' },
      update: {},
      create: {
        applicationNumber: 'TEST-APP-BETA-02',
        institutionId: instB.id,
        type: 'NEW_INSTITUTION_LOA',
        academicYear: '2026-2027',
        currentState: 'DRAFT',
        workflowDefinitionKey: 'NEW_INSTITUTION_LOA_V1',
        workflowVersion: 1,
        assignedRegion: 'SOUTH',
      },
    });

    // Regional Officer North
    roNorthUser = await prisma.user.upsert({
      where: { email: 'ro-north-tester@test.edu' },
      update: { assignedRegion: 'NORTH' },
      create: {
        email: 'ro-north-tester@test.edu',
        fullName: 'RO North Tester',
        passwordHash: 'dummy',
        status: 'ACTIVE',
        assignedRegion: 'NORTH',
      },
    });

    const existingRoleRO = await prisma.userRole.findFirst({
      where: { userId: roNorthUser.id, roleId: roRole!.id },
    });
    if (!existingRoleRO) {
      await prisma.userRole.create({
        data: {
          userId: roNorthUser.id,
          roleId: roRole!.id,
          scopeType: 'REGIONAL',
          scopeValue: 'NORTH',
        },
      });
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. Institution A reading Institution A application succeeds', async () => {
    const access = await scopeService.assertApplicationAccess(instAUser.id, appA.id);
    expect(access).toBeDefined();
    expect(access.institutionId).toEqual(instAUser.institutionId);
  });

  it('2. Institution A reading Institution B application by ID throws 404 NotFoundException', async () => {
    await expect(
      scopeService.assertApplicationAccess(instAUser.id, appB.id)
    ).rejects.toThrow(NotFoundException);
  });

  it('3. Regional Officer North reading South application by ID throws 404 NotFoundException', async () => {
    await expect(
      scopeService.assertApplicationAccess(roNorthUser.id, appB.id)
    ).rejects.toThrow(NotFoundException);
  });

  it('4. List filter for Institution A returns ONLY Institution A applications', async () => {
    const filter = await scopeService.buildApplicationListFilter(instAUser.id);
    expect(filter.institutionId).toEqual(instAUser.institutionId);

    const results = await prisma.application.findMany({ where: filter });
    const hasOtherInst = results.some((r) => r.institutionId !== instAUser.institutionId);
    expect(hasOtherInst).toBe(false);
  });

  it('5. List filter for RO North returns ONLY North region applications', async () => {
    const filter = await scopeService.buildApplicationListFilter(roNorthUser.id);
    expect(filter.assignedRegion).toEqual('NORTH');

    const results = await prisma.application.findMany({ where: filter });
    const hasSouthApp = results.some((r) => r.assignedRegion === 'SOUTH');
    expect(hasSouthApp).toBe(false);
  });
});
