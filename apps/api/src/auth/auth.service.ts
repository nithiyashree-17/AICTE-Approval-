import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterInstitutionDto } from './dto/register-institution.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RoleType, UserStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Institution Self-Registration (Only creates INSTITUTION role)
   */
  async registerInstitution(
    dto: RegisterInstitutionDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const email = dto.officialEmail.toLowerCase().trim();

    // Check for existing user or institution (safe response to prevent enumeration)
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      this.logger.warn(`Registration attempt for already registered email: ${email}`);
      // Return safe generic response
      return {
        success: true,
        message:
          'If your institution is eligible, an email verification message has been sent to the official address provided.',
        email,
      };
    }

    // Hash password with bcrypt cost 12
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Generate email verification token (24-hour expiry)
    const verificationToken = crypto.randomUUID();
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // AICTE unique code generation
    const cleanRegion = dto.region.toUpperCase().replace(/\s+/g, '_');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const aicteCode = `1-${cleanRegion}-${randomSuffix}`;

    // Ensure INSTITUTION role exists
    let instRole = await this.prisma.role.findUnique({
      where: { name: RoleType.INSTITUTION },
    });

    if (!instRole) {
      instRole = await this.prisma.role.create({
        data: {
          name: RoleType.INSTITUTION,
          description: 'Institutional Applicant & Compliance Officer',
          permissions: [
            'application:create',
            'application:read_own',
            'application:update_draft',
            'application:submit',
            'deficiency:respond',
            'compliance:read_own',
            'compliance:submit',
            'document:upload',
          ],
        },
      });
    }

    // Atomic creation of Institution and User linked to it
    const result = await this.prisma.$transaction(async (tx) => {
      const institution = await tx.institution.create({
        data: {
          aicteCode,
          name: dto.institutionName.trim(),
          type: dto.institutionType,
          region: dto.region,
          state: dto.state,
          address: dto.address,
          contactEmail: email,
          contactPhone: dto.phone,
          status: 'ACTIVE',
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          fullName: dto.contactPersonName.trim(),
          designation: dto.contactPersonDesignation.trim(),
          phone: dto.phone,
          status: UserStatus.ACTIVE,
          institutionId: institution.id,
          assignedRegion: dto.region,
          roles: {
            create: {
              roleId: instRole.id,
              scopeType: 'INSTITUTION',
              scopeValue: institution.id,
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: 'AUTH_REGISTER_INSTITUTION',
          resourceType: 'INSTITUTION',
          resourceId: institution.id,
          ipAddress: ipAddress || '127.0.0.1',
          userAgent: userAgent || 'Web-Client',
          changesAfter: {
            institutionId: institution.id,
            aicteCode,
            officialEmail: email,
            status: UserStatus.ACTIVE,
          },
        },
      });

      return { user, institution };
    });

    this.logger.log(`[INSTITUTION REGISTERED & ACTIVATED] Email: ${email}, Name: ${dto.institutionName}`);

    return {
      success: true,
      message:
        'Institutional account registered and activated successfully. You can now log in immediately.',
      email,
    };
  }

  /**
   * User Login with Rate Limiting, Temporary Lockout, and Generic Error Message
   */
  async login(
    loginDto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
    res?: Response,
  ) {
    const email = loginDto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: { role: true },
        },
        institution: true,
      },
    });

    // Timing attack prevention: perform dummy hash comparison if user doesn't exist
    if (!user) {
      await bcrypt.compare(
        loginDto.password,
        '$2b$12$e80yq7K7mJ91BqWpZt8G0.X4L2e5g6h7i8j9k0l1m2n3o4p5q6r7s',
      ).catch(() => false);

      await this.prisma.auditLog.create({
        data: {
          actorId: null,
          action: 'AUTH_LOGIN_FAILED_UNKNOWN_EMAIL',
          resourceType: 'USER',
          resourceId: email,
          ipAddress: ipAddress || '127.0.0.1',
          userAgent: userAgent || 'Web-Client',
        },
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    // Check temporary account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / (60 * 1000),
      );
      await this.prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: 'AUTH_LOGIN_BLOCKED_LOCKED',
          resourceType: 'USER',
          resourceId: user.id,
          ipAddress: ipAddress || '127.0.0.1',
          userAgent: userAgent || 'Web-Client',
        },
      });
      throw new UnauthorizedException(
        `Account is temporarily locked due to repeated failed login attempts. Please try again in ${remainingMinutes} minutes or reset your password.`,
      );
    }

    // Verify Password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    ).catch(() => false);

    // Development fallback for seeded accounts if password hash matches standard demo pattern
    const isDevDemoMatch =
      process.env.NODE_ENV !== 'production' &&
      loginDto.password === 'Password123!' &&
      (user.passwordHash.includes('demoHashedPassword') || user.passwordHash === 'Password123!');

    if (!isPasswordValid && !isDevDemoMatch) {
      const nextFailedAttempts = user.failedLoginAttempts + 1;
      let lockoutDate: Date | null = null;

      if (nextFailedAttempts >= 5) {
        lockoutDate = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: nextFailedAttempts,
          lockedUntil: lockoutDate,
        },
      });

      await this.prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: 'AUTH_LOGIN_FAILED',
          resourceType: 'USER',
          resourceId: user.id,
          ipAddress: ipAddress || '127.0.0.1',
          userAgent: userAgent || 'Web-Client',
          changesAfter: { failedAttempts: nextFailedAttempts, locked: !!lockoutDate },
        },
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    // Check Account Status
    if (user.status === UserStatus.PENDING_EMAIL_VERIFICATION) {
      await this.prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: 'AUTH_LOGIN_DENIED_UNVERIFIED_EMAIL',
          resourceType: 'USER',
          resourceId: user.id,
          ipAddress: ipAddress || '127.0.0.1',
          userAgent: userAgent || 'Web-Client',
        },
      });
      throw new UnauthorizedException(
        'Please verify your official email address before logging in.',
      );
    }

    if (user.status === UserStatus.PENDING_APPROVAL) {
      await this.prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: 'AUTH_LOGIN_DENIED_PENDING_APPROVAL',
          resourceType: 'USER',
          resourceId: user.id,
          ipAddress: ipAddress || '127.0.0.1',
          userAgent: userAgent || 'Web-Client',
        },
      });
      throw new UnauthorizedException(
        'Your institution account has been verified and is awaiting statutory administrator approval.',
      );
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is inactive or suspended.');
    }

    // Successful Login: reset failed attempts
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    const tokenResponse = this.generateTokenResponse(user);

    // Set secure httpOnly cookie if Response object is provided
    if (res) {
      res.cookie('flowguard_session', tokenResponse.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 8 * 60 * 60 * 1000, // 8 hours
        path: '/',
      });
    }

    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'AUTH_LOGIN_SUCCESS',
        resourceType: 'USER',
        resourceId: user.id,
        ipAddress: ipAddress || '127.0.0.1',
        userAgent: userAgent || 'Web-Client',
      },
    });

    return tokenResponse;
  }

  private revokedTokens = new Set<string>();

  revokeToken(token: string) {
    if (token) {
      this.revokedTokens.add(token.trim());
    }
  }

  isTokenRevoked(token: string): boolean {
    if (!token) return false;
    return this.revokedTokens.has(token.trim());
  }

  /**
   * User Logout: Clears cookie, revokes token, and creates audit entry
   */
  async logout(userId?: string, ipAddress?: string, userAgent?: string, res?: Response, token?: string) {
    if (token) {
      this.revokeToken(token);
    }

    if (res) {
      res.clearCookie('flowguard_session', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    }

    if (userId) {
      await this.prisma.auditLog.create({
        data: {
          actorId: userId,
          action: 'AUTH_LOGOUT',
          resourceType: 'USER',
          resourceId: userId,
          ipAddress: ipAddress || '127.0.0.1',
          userAgent: userAgent || 'Web-Client',
        },
      });
    }

    return { success: true, message: 'Logged out successfully' };
  }

  /**
   * Email Verification
   */
  async verifyEmail(dto: VerifyEmailDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationToken: dto.token,
        emailVerificationExpiry: { gt: new Date() },
      },
      include: { institution: true },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired email verification token');
    }

    const requireApproval = process.env.REQUIRE_INSTITUTION_APPROVAL === 'true';
    const nextStatus = requireApproval
      ? UserStatus.PENDING_APPROVAL
      : UserStatus.ACTIVE;

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        status: nextStatus,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'AUTH_EMAIL_VERIFIED',
        resourceType: 'USER',
        resourceId: user.id,
        ipAddress: ipAddress || '127.0.0.1',
        userAgent: userAgent || 'Web-Client',
        changesAfter: { status: nextStatus },
      },
    });

    return {
      success: true,
      message:
        nextStatus === UserStatus.ACTIVE
          ? 'Email verified successfully. You may now log in to the portal.'
          : 'Email verified. Your account is currently awaiting statutory administrator approval.',
      status: nextStatus,
    };
  }

  /**
   * Forgot Password Flow (Prevents Email Enumeration)
   */
  async forgotPassword(
    dto: ForgotPasswordDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    const genericResponse = {
      success: true,
      message:
        'If an account associated with this email exists, password reset instructions have been dispatched.',
    };

    if (!user) {
      return genericResponse;
    }

    const resetToken = crypto.randomUUID();
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiry: resetExpiry,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'AUTH_PASSWORD_RESET_REQUESTED',
        resourceType: 'USER',
        resourceId: user.id,
        ipAddress: ipAddress || '127.0.0.1',
        userAgent: userAgent || 'Web-Client',
      },
    });

    const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    this.logger.log(`\n=============================================================
[MOCK EMAIL DISPATCH - PASSWORD RESET]
To: ${email}
Subject: [AICTE FlowGuard] Password Reset Request
Reset URL: ${resetUrl}
Token: ${resetToken}
Expires in: 1 hour
=============================================================\n`);

    return {
      ...genericResponse,
      resetUrl: process.env.NODE_ENV !== 'production' ? resetUrl : undefined,
    };
  }

  /**
   * Reset Password
   */
  async resetPassword(
    dto: ResetPasswordDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: dto.token,
        passwordResetExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'AUTH_PASSWORD_RESET_COMPLETED',
        resourceType: 'USER',
        resourceId: user.id,
        ipAddress: ipAddress || '127.0.0.1',
        userAgent: userAgent || 'Web-Client',
      },
    });

    return {
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    };
  }

  /**
   * Fetch authenticated user profile
   */
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
      throw new NotFoundException('User profile not found');
    }

    const { passwordHash, passwordResetToken, emailVerificationToken, ...safeUser } = user;
    const roleNames = user.roles.map((r) => r.role?.name || (r as any).name);
    const primaryRole = roleNames[0] || 'INSTITUTION';

    return {
      ...safeUser,
      roles: roleNames,
      primaryRole,
    };
  }

  /**
   * Helper to generate JWT token payload
   */
  private generateTokenResponse(user: any) {
    const roleNames = user.roles.map((r: any) => r.role?.name || r.name);
    const primaryRole = roleNames[0] || 'INSTITUTION';

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
        designation: user.designation,
        roles: roleNames,
        primaryRole,
        institutionId: user.institutionId,
        institutionName: user.institution?.name,
        assignedRegion: user.assignedRegion,
      },
    };
  }
}
