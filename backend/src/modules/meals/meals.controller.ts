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
import { MealsService } from './meals.service';
import { CreateMealDto, UpdateMealDto } from './dto/meal.dto';
import { CurrentUser } from '../../common/decorators';
import { User } from '../users/user.entity';

@ApiTags('Meals')
@ApiBearerAuth()
@Controller('api/v1/meals')
export class MealsController {
  constructor(private readonly mealsService: MealsService) {}

  @Post()
  @ApiOperation({ summary: 'Log a meal' })
  create(@CurrentUser() user: User, @Body() dto: CreateMealDto) {
    return this.mealsService.create(user.id, dto);
  }

  @Get('baby/:babyId')
  @ApiOperation({ summary: 'Get meals for a baby' })
  @ApiQuery({ name: 'date', required: false, example: '2026-02-08' })
  findAll(
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @CurrentUser() user: User,
    @Query('date') date?: string,
  ) {
    return this.mealsService.findAllForBaby(babyId, user.id, date);
  }

  @Put(':mealId')
  @ApiOperation({ summary: 'Update a meal' })
  update(
    @Param('mealId', ParseUUIDPipe) mealId: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateMealDto,
  ) {
    return this.mealsService.update(mealId, user.id, dto);
  }

  @Delete(':mealId')
  @ApiOperation({ summary: 'Delete a meal' })
  delete(
    @Param('mealId', ParseUUIDPipe) mealId: string,
    @CurrentUser() user: User,
  ) {
    return this.mealsService.delete(mealId, user.id);
  }
}
