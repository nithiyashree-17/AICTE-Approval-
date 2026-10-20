import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterInstitutionDto } from './dto/register-institution.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register-institution')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Public self-registration for new or existing educational institutions',
    description:
      'Creates an institution entity and an administrator user with the INSTITUTION role strictly. Roles cannot be elevated via request body.',
  })
  @ApiResponse({
    status: 201,
    description: 'Institution registered; verification email dispatched',
  })
  @ApiResponse({ status: 400, description: 'Validation error or invalid inputs' })
  registerInstitution(
    @Body() dto: RegisterInstitutionDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const userAgent = (req.headers['user-agent'] as string) || '';
    return this.authService.registerInstitution(dto, ipAddress, userAgent);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate user with email and password',
    description:
      'Authenticates user, sets httpOnly session cookie and returns JWT bearer token. Enforces account lockout on repeated failures.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful; session token issued',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials or locked account' })
  login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const userAgent = (req.headers['user-agent'] as string) || '';
    return this.authService.login(loginDto, ipAddress, userAgent, res);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log out current session and invalidate cookies' })
  @ApiResponse({ status: 200, description: 'Successfully logged out' })
  logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser('id') userId?: string,
  ) {
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const userAgent = (req.headers['user-agent'] as string) || '';
    const token = (req.cookies && req.cookies['flowguard_session']) || (req.headers.authorization && req.headers.authorization.replace(/^Bearer\s+/i, ''));
    return this.authService.logout(userId, ipAddress, userAgent, res, token);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify institutional user email address with security token' })
  @ApiResponse({ status: 200, description: 'Email address successfully verified' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  verifyEmail(
    @Body() dto: VerifyEmailDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const userAgent = (req.headers['user-agent'] as string) || '';
    return this.authService.verifyEmail(dto, ipAddress, userAgent);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset email link',
    description: 'Dispatches password reset instructions safely without revealing email existence.',
  })
  @ApiResponse({ status: 200, description: 'Reset link dispatched if account exists' })
  forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const userAgent = (req.headers['user-agent'] as string) || '';
    return this.authService.forgotPassword(dto, ipAddress, userAgent);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset account password using secure token' })
  @ApiResponse({ status: 200, description: 'Password successfully reset' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  resetPassword(
    @Body() dto: ResetPasswordDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const userAgent = (req.headers['user-agent'] as string) || '';
    return this.authService.resetPassword(dto, ipAddress, userAgent);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve current authenticated user profile & roles' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }
}
