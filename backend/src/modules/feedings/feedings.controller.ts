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
import { FeedingsService } from './feedings.service';
import { CreateFeedingDto, UpdateFeedingDto } from './dto/feeding.dto';
import { CurrentUser } from '../../common/decorators';
import { User } from '../users/user.entity';

@ApiTags('Feedings')
@ApiBearerAuth()
@Controller('api/v1/feedings')
export class FeedingsController {
  constructor(private readonly feedingsService: FeedingsService) {}

  @Post()
  @ApiOperation({ summary: 'Log a new feeding' })
  create(@CurrentUser() user: User, @Body() dto: CreateFeedingDto) {
    return this.feedingsService.create(user.id, dto);
  }

  @Get('baby/:babyId')
  @ApiOperation({ summary: 'Get all feedings for a baby' })
  @ApiQuery({ name: 'date', required: false, example: '2026-02-08' })
  findAll(
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @CurrentUser() user: User,
    @Query('date') date?: string,
  ) {
    return this.feedingsService.findAllForBaby(babyId, user.id, date);
  }

  @Get('baby/:babyId/summary')
  @ApiOperation({ summary: 'Get daily feeding summary' })
  @ApiQuery({ name: 'date', required: true, example: '2026-02-08' })
  getDailySummary(
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @CurrentUser() user: User,
    @Query('date') date: string,
  ) {
    return this.feedingsService.getDailySummary(babyId, user.id, date);
  }

  @Put(':feedingId')
  @ApiOperation({ summary: 'Update a feeding record' })
  update(
    @Param('feedingId', ParseUUIDPipe) feedingId: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateFeedingDto,
  ) {
    return this.feedingsService.update(feedingId, user.id, dto);
  }

  @Delete(':feedingId')
  @ApiOperation({ summary: 'Delete a feeding record' })
  delete(
    @Param('feedingId', ParseUUIDPipe) feedingId: string,
    @CurrentUser() user: User,
  ) {
    return this.feedingsService.delete(feedingId, user.id);
  }
}
