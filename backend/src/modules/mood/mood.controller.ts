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
import { MoodService } from './mood.service';
import { CreateMoodDto, UpdateMoodDto } from './dto/mood.dto';
import { CurrentUser } from '../../common/decorators';
import { User } from '../users/user.entity';

@ApiTags('Mood')
@ApiBearerAuth()
@Controller('api/v1/mood')
export class MoodController {
  constructor(private readonly moodService: MoodService) {}

  @Post()
  @ApiOperation({ summary: 'Log baby mood' })
  create(@CurrentUser() user: User, @Body() dto: CreateMoodDto) {
    return this.moodService.create(user.id, dto);
  }

  @Get('baby/:babyId')
  @ApiOperation({ summary: 'Get mood logs for a baby' })
  @ApiQuery({ name: 'date', required: false, example: '2026-02-08' })
  findAll(
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @CurrentUser() user: User,
    @Query('date') date?: string,
  ) {
    return this.moodService.findAllForBaby(babyId, user.id, date);
  }

  @Put(':moodId')
  @ApiOperation({ summary: 'Update a mood log' })
  update(
    @Param('moodId', ParseUUIDPipe) moodId: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateMoodDto,
  ) {
    return this.moodService.update(moodId, user.id, dto);
  }

  @Delete(':moodId')
  @ApiOperation({ summary: 'Delete a mood log' })
  delete(
    @Param('moodId', ParseUUIDPipe) moodId: string,
    @CurrentUser() user: User,
  ) {
    return this.moodService.delete(moodId, user.id);
  }
}
