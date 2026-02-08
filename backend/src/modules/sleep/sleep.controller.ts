import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SleepService } from './sleep.service';
import { CreateSleepDto, UpdateSleepDto } from './dto/sleep.dto';
import { CurrentUser } from '../../common/decorators';
import { User } from '../users/user.entity';

@ApiTags('Sleep')
@ApiBearerAuth()
@Controller('api/v1/sleep')
export class SleepController {
  constructor(private readonly sleepService: SleepService) {}

  @Post()
  @ApiOperation({ summary: 'Log a sleep session' })
  create(@CurrentUser() user: User, @Body() dto: CreateSleepDto) {
    return this.sleepService.create(user.id, dto);
  }

  @Get('baby/:babyId')
  @ApiOperation({ summary: 'Get sleep logs for a baby' })
  @ApiQuery({ name: 'date', required: false, example: '2026-02-08' })
  findAll(
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @CurrentUser() user: User,
    @Query('date') date?: string,
  ) {
    return this.sleepService.findAllForBaby(babyId, user.id, date);
  }

  @Get('baby/:babyId/summary')
  @ApiOperation({ summary: 'Get daily sleep summary' })
  @ApiQuery({ name: 'date', required: true, example: '2026-02-08' })
  getDailySummary(
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @CurrentUser() user: User,
    @Query('date') date: string,
  ) {
    return this.sleepService.getDailySummary(babyId, user.id, date);
  }

  @Put(':sleepId')
  @ApiOperation({ summary: 'Update a sleep log' })
  update(
    @Param('sleepId', ParseUUIDPipe) sleepId: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateSleepDto,
  ) {
    return this.sleepService.update(sleepId, user.id, dto);
  }

  @Delete(':sleepId')
  @ApiOperation({ summary: 'Delete a sleep log' })
  delete(
    @Param('sleepId', ParseUUIDPipe) sleepId: string,
    @CurrentUser() user: User,
  ) {
    return this.sleepService.delete(sleepId, user.id);
  }
}
