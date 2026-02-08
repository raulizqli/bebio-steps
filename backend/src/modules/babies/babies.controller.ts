import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BabiesService } from './babies.service';
import { CreateBabyDto, UpdateBabyDto, SetGoalsDto } from './dto/baby.dto';
import { CurrentUser } from '../../common/decorators';
import { User } from '../users/user.entity';

@ApiTags('Babies')
@ApiBearerAuth()
@Controller('api/v1/babies')
export class BabiesController {
  constructor(private readonly babiesService: BabiesService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new baby' })
  create(@CurrentUser() user: User, @Body() dto: CreateBabyDto) {
    return this.babiesService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all babies for the current user' })
  findAll(@CurrentUser() user: User) {
    return this.babiesService.findAllForUser(user.id);
  }

  @Get(':babyId')
  @ApiOperation({ summary: 'Get baby details' })
  findOne(
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @CurrentUser() user: User,
  ) {
    return this.babiesService.findOne(babyId, user.id);
  }

  @Put(':babyId')
  @ApiOperation({ summary: 'Update baby information' })
  update(
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateBabyDto,
  ) {
    return this.babiesService.update(babyId, user.id, dto);
  }

  @Post(':babyId/goals')
  @ApiOperation({ summary: 'Set daily goals (sleep hours, feeding oz, meals)' })
  setGoals(
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @CurrentUser() user: User,
    @Body() dto: SetGoalsDto,
  ) {
    return this.babiesService.setGoals(babyId, user.id, dto);
  }

  @Get(':babyId/goals')
  @ApiOperation({ summary: 'Get baby goals' })
  getGoals(
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @CurrentUser() user: User,
  ) {
    return this.babiesService.getGoals(babyId, user.id);
  }

  @Get(':babyId/caregivers')
  @ApiOperation({ summary: 'List all caregivers for a baby' })
  getCaregivers(
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @CurrentUser() user: User,
  ) {
    return this.babiesService.getCaregivers(babyId, user.id);
  }

  @Delete(':babyId/caregivers/:caregiverId')
  @ApiOperation({ summary: 'Remove a caregiver' })
  removeCaregiver(
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @CurrentUser() user: User,
  ) {
    return this.babiesService.removeCaregiver(babyId, caregiverId, user.id);
  }

  @Post(':babyId/revoke-access/:targetUserId')
  @ApiOperation({ summary: 'Revoke access for a nanny/family member' })
  revokeAccess(
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @Param('targetUserId', ParseUUIDPipe) targetUserId: string,
    @CurrentUser() user: User,
  ) {
    return this.babiesService.revokeAccess(babyId, targetUserId, user.id);
  }
}
