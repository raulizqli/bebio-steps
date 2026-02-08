import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Medicine } from './medicine.entity';
import { MedicinesService } from './medicines.service';
import { MedicinesController } from './medicines.controller';
import { BabiesModule } from '../babies/babies.module';

@Module({
  imports: [TypeOrmModule.forFeature([Medicine]), BabiesModule],
  controllers: [MedicinesController],
  providers: [MedicinesService],
  exports: [MedicinesService],
})
export class MedicinesModule {}
