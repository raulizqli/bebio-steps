import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Meal } from './meal.entity';
import { MealsService } from './meals.service';
import { MealsController } from './meals.controller';
import { BabiesModule } from '../babies/babies.module';

@Module({
  imports: [TypeOrmModule.forFeature([Meal]), BabiesModule],
  controllers: [MealsController],
  providers: [MealsService],
  exports: [MealsService],
})
export class MealsModule {}
