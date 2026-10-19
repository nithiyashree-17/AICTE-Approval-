import { Controller, Post, Body, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { DemoLoginDto } from './dto/demo-login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user with email and password' })
  @ApiResponse({ status: 200, description: 'JWT Access token returned successfully' })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('demo-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Switch demo account by role (Development/Demo mode only)' })
  @ApiResponse({ status: 200, description: 'Demo token generated for chosen role' })
  @ApiResponse({ status: 403, description: 'Demo switcher disabled in production' })
  demoLogin(@Body() demoDto: DemoLoginDto) {
    return this.authService.demoLogin(demoDto.role);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve current authenticated user profile & roles' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }
}
