import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Symptom } from './symptom.entity';
import { SymptomsService } from './symptoms.service';
import { SymptomsController } from './symptoms.controller';
import { BabiesModule } from '../babies/babies.module';

@Module({
  imports: [TypeOrmModule.forFeature([Symptom]), BabiesModule],
  controllers: [SymptomsController],
  providers: [SymptomsService],
  exports: [SymptomsService],
})
export class SymptomsModule {}
