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
import { MedicinesService } from './medicines.service';
import { CreateMedicineDto, UpdateMedicineDto } from './dto/medicine.dto';
import { CurrentUser } from '../../common/decorators';
import { User } from '../users/user.entity';

@ApiTags('Medicines')
@ApiBearerAuth()
@Controller('api/v1/medicines')
export class MedicinesController {
  constructor(private readonly medicinesService: MedicinesService) {}

  @Post()
  @ApiOperation({ summary: 'Log a medicine administration' })
  create(@CurrentUser() user: User, @Body() dto: CreateMedicineDto) {
    return this.medicinesService.create(user.id, dto);
  }

  @Get('baby/:babyId')
  @ApiOperation({ summary: 'Get all medicines for a baby' })
  findAll(
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @CurrentUser() user: User,
  ) {
    return this.medicinesService.findAllForBaby(babyId, user.id);
  }

  @Get('baby/:babyId/active')
  @ApiOperation({ summary: 'Get active medicines for a baby' })
  getActive(
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @CurrentUser() user: User,
  ) {
    return this.medicinesService.getActiveMedicines(babyId, user.id);
  }

  @Put(':medicineId')
  @ApiOperation({ summary: 'Update a medicine record' })
  update(
    @Param('medicineId', ParseUUIDPipe) medicineId: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateMedicineDto,
  ) {
    return this.medicinesService.update(medicineId, user.id, dto);
  }

  @Delete(':medicineId')
  @ApiOperation({ summary: 'Delete a medicine record' })
  delete(
    @Param('medicineId', ParseUUIDPipe) medicineId: string,
    @CurrentUser() user: User,
  ) {
    return this.medicinesService.delete(medicineId, user.id);
  }
}
