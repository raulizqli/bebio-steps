import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Baby } from './baby.entity';
import { BabyCaregiver } from './baby-caregiver.entity';
import { BabyGoal } from './baby-goal.entity';
import { BabiesService } from './babies.service';
import { BabiesController } from './babies.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Baby, BabyCaregiver, BabyGoal])],
  controllers: [BabiesController],
  providers: [BabiesService],
  exports: [BabiesService],
})
export class BabiesModule {}
