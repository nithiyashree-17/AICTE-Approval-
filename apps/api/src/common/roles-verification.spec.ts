import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../app.module';
import { AuthService } from '../auth/auth.service';
import { ScopeService } from './scope.service';
import { PrismaService } from '../prisma/prisma.service';
import { getRoleLandingRoute, isRouteAllowedForRole, RoleType } from '@flowguard/shared';

describe('Step 2 Comprehensive Automated Role Verification (All 9 Roles)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let scopeService: ScopeService;
  let prisma: PrismaService;

  const ROLES_TO_VERIFY = [
    { email: 'institution@flowguard.local', role: RoleType.INSTITUTION, expectedLanding: '/institution/dashboard', blockedRoute: '/regional/dashboard' },
    { email: 'ro@flowguard.local', role: RoleType.REGIONAL_OFFICER, expectedLanding: '/regional/dashboard', blockedRoute: '/institution/dashboard' },
    { email: 'bureau@flowguard.local', role: RoleType.BUREAU_OFFICER, expectedLanding: '/bureau/dashboard', blockedRoute: '/institution/dashboard' },
    { email: 'scrutiny@flowguard.local', role: RoleType.SCRUTINY_OFFICER, expectedLanding: '/scrutiny/dashboard', blockedRoute: '/institution/dashboard' },
    { email: 'evc_coord@flowguard.local', role: RoleType.EVC_COORDINATOR, expectedLanding: '/evc/dashboard', blockedRoute: '/institution/dashboard' },
    { email: 'evc_member@flowguard.local', role: RoleType.EVC_MEMBER, expectedLanding: '/evc-member/my-visits', blockedRoute: '/institution/dashboard' },
    { email: 'sac_shc@flowguard.local', role: RoleType.SAC_SHC, expectedLanding: '/committee/agenda', blockedRoute: '/institution/dashboard' },
    { email: 'authority@flowguard.local', role: RoleType.COMPETENT_AUTHORITY, expectedLanding: '/authority/overview', blockedRoute: '/institution/dashboard' },
    { email: 'admin@flowguard.local', role: RoleType.SYSTEM_ADMINISTRATOR, expectedLanding: '/admin/dashboard', blockedRoute: '/institution/dashboard' },
  ];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    authService = app.get(AuthService);
    scopeService = app.get(ScopeService);
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  for (const item of ROLES_TO_VERIFY) {
    describe(`Role: ${item.role}`, () => {
      it(`[${item.role}] 1. Authenticates & lands on canonical route: ${item.expectedLanding}`, async () => {
        const loginRes = await authService.login({
          email: item.email,
          password: 'Password123!',
        });

        expect(loginRes.accessToken).toBeDefined();
        expect(loginRes.user.primaryRole).toEqual(item.role);

        const landing = getRoleLandingRoute(loginRes.user.primaryRole);
        expect(landing).toEqual(item.expectedLanding);
      });

      it(`[${item.role}] 2. Blocked from cross-role URL: ${item.blockedRoute}`, () => {
        const isAllowed = isRouteAllowedForRole(item.blockedRoute, item.role);
        expect(isAllowed).toBe(false);
      });

      it(`[${item.role}] 3. Data Scoping resolves accurately from DB`, async () => {
        const user = await prisma.user.findUnique({ where: { email: item.email } });
        expect(user).toBeDefined();

        const scope = await scopeService.resolveScope(user!.id);
        expect(scope.roles).toContain(item.role);

        const filter = await scopeService.buildApplicationListFilter(user!.id);
        if (item.role === RoleType.INSTITUTION) {
          expect(filter.institutionId).toEqual(user!.institutionId);
        } else if (item.role === RoleType.REGIONAL_OFFICER) {
          expect(filter.assignedRegion).toEqual(user!.assignedRegion);
        }
      });
    });
  }
});
