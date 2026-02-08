import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SharingService } from './sharing.service';
import { CreateInviteDto, AcceptInviteDto, UpdatePermissionsDto } from './dto/sharing.dto';
import { CurrentUser } from '../../common/decorators';
import { User } from '../users/user.entity';

@ApiTags('Sharing & Invites')
@ApiBearerAuth()
@Controller('api/v1/sharing')
export class SharingController {
  constructor(private readonly sharingService: SharingService) {}

  @Post('invite')
  @ApiOperation({ summary: 'Create an invite code for nanny/family' })
  createInvite(@CurrentUser() user: User, @Body() dto: CreateInviteDto) {
    return this.sharingService.createInvite(user.id, dto);
  }

  @Post('accept')
  @ApiOperation({ summary: 'Accept an invite code' })
  acceptInvite(@CurrentUser() user: User, @Body() dto: AcceptInviteDto) {
    return this.sharingService.acceptInvite(user.id, dto);
  }

  @Post('revoke/:inviteId')
  @ApiOperation({ summary: 'Revoke an invite and remove access' })
  revokeInvite(
    @Param('inviteId', ParseUUIDPipe) inviteId: string,
    @CurrentUser() user: User,
  ) {
    return this.sharingService.revokeInvite(inviteId, user.id);
  }

  @Get('invites/:babyId')
  @ApiOperation({ summary: 'List all invites for a baby' })
  getInvites(
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @CurrentUser() user: User,
  ) {
    return this.sharingService.getInvites(babyId, user.id);
  }

  @Put(':babyId/permissions/:targetUserId')
  @ApiOperation({ summary: 'Update caregiver permissions' })
  updatePermissions(
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @Param('targetUserId', ParseUUIDPipe) targetUserId: string,
    @CurrentUser() user: User,
    @Body() dto: UpdatePermissionsDto,
  ) {
    return this.sharingService.updateCaregiverPermissions(
      babyId,
      targetUserId,
      user.id,
      dto,
    );
  }
}
