import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SleepLog } from './sleep.entity';
import { SleepService } from './sleep.service';
import { SleepController } from './sleep.controller';
import { BabiesModule } from '../babies/babies.module';

@Module({
  imports: [TypeOrmModule.forFeature([SleepLog]), BabiesModule],
  controllers: [SleepController],
  providers: [SleepService],
  exports: [SleepService],
})
export class SleepModule {}
