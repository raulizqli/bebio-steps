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
import { SymptomsService } from './symptoms.service';
import { CreateSymptomDto, UpdateSymptomDto } from './dto/symptom.dto';
import { CurrentUser } from '../../common/decorators';
import { User } from '../users/user.entity';

@ApiTags('Symptoms & Illnesses')
@ApiBearerAuth()
@Controller('api/v1/symptoms')
export class SymptomsController {
  constructor(private readonly symptomsService: SymptomsService) {}

  @Post()
  @ApiOperation({ summary: 'Log a symptom' })
  create(@CurrentUser() user: User, @Body() dto: CreateSymptomDto) {
    return this.symptomsService.create(user.id, dto);
  }

  @Get('baby/:babyId')
  @ApiOperation({ summary: 'Get symptoms for a baby' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  findAll(
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @CurrentUser() user: User,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.symptomsService.findAllForBaby(
      babyId,
      user.id,
      activeOnly === 'true',
    );
  }

  @Put(':symptomId')
  @ApiOperation({ summary: 'Update a symptom (e.g. mark as resolved)' })
  update(
    @Param('symptomId', ParseUUIDPipe) symptomId: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateSymptomDto,
  ) {
    return this.symptomsService.update(symptomId, user.id, dto);
  }

  @Delete(':symptomId')
  @ApiOperation({ summary: 'Delete a symptom' })
  delete(
    @Param('symptomId', ParseUUIDPipe) symptomId: string,
    @CurrentUser() user: User,
  ) {
    return this.symptomsService.delete(symptomId, user.id);
  }
}
