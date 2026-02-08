import { Controller, Post, Body, Get, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, UpdateProfileDto, LinkAlexaDto } from './dto/auth.dto';
import { Public, CurrentUser } from '../../common/decorators';
import { User } from '../users/user.entity';

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new parent account' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@CurrentUser() user: User) {
    return this.authService.getProfile(user.id);
  }

  @Put('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  updateProfile(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(user.id, dto);
  }

  @Post('link-alexa')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link Alexa account to user' })
  linkAlexa(@CurrentUser() user: User, @Body() dto: LinkAlexaDto) {
    return this.authService.linkAlexa(user.id, dto);
  }
}
