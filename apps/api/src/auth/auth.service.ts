import { Injectable, UnauthorizedException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RoleType } from '../common/enums';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: {
        roles: {
          include: { role: true },
        },
        institution: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash).catch(() => false);
    
    // In local dev demo accounts, permit standard demo credentials
    const isDevDemoMatch =
      process.env.NODE_ENV !== 'production' &&
      loginDto.password === 'Password123!' &&
      user.passwordHash.includes('demoHashedPassword');

    if (!isPasswordValid && !isDevDemoMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.generateTokenResponse(user);
  }

  async demoLogin(role: RoleType) {
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_DEMO_ACCOUNT_SWITCHER === 'false') {
      throw new ForbiddenException('Demo account switching is disabled in this environment');
    }

    const userRole = await this.prisma.userRole.findFirst({
      where: {
        role: {
          name: role,
        },
      },
      include: {
        user: {
          include: {
            roles: {
              include: { role: true },
            },
            institution: true,
          },
        },
      },
    });

    if (!userRole || !userRole.user) {
      throw new NotFoundException(`No seeded demo user found for role: ${role}. Run "pnpm db:seed".`);
    }

    return this.generateTokenResponse(userRole.user);
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: { role: true },
        },
        institution: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  private generateTokenResponse(user: any) {
    const roleNames = user.roles.map((r: any) => r.role?.name || r.name);
    const primaryRole = roleNames[0] || 'GUEST';

    const payload = {
      sub: user.id,
      email: user.email,
      roles: roleNames,
      primaryRole,
      institutionId: user.institutionId,
      assignedRegion: user.assignedRegion,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roles: roleNames,
        primaryRole,
        institutionId: user.institutionId,
        institutionName: user.institution?.name,
        assignedRegion: user.assignedRegion,
      },
    };
  }
}
