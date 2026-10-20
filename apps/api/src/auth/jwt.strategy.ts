import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.['flowguard_session'] || null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      passReqToCallback: true,
      ignoreExpiration: false,
      secretOrKey: process.env.AUTH_SECRET || 'flowguard-default-secret-key-replace-in-production-32chars',
    });
  }

  async validate(req: Request, payload: { sub: string; email: string }) {
    const token = req?.cookies?.['flowguard_session'] || req?.headers?.authorization?.replace(/^Bearer\s+/i, '');
    if (token && this.authService.isTokenRevoked(token)) {
      throw new UnauthorizedException('Session has been revoked');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        institution: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User account not found');
    }

    if (user.status === 'PENDING_EMAIL_VERIFICATION') {
      throw new UnauthorizedException('Please verify your email address to access your account');
    }

    if (user.status === 'PENDING_APPROVAL') {
      throw new UnauthorizedException('Your institution account is awaiting statutory administrator approval');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is inactive or suspended');
    }

    return user;
  }
}
