import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlexaService } from './alexa.service';
import { AlexaController } from './alexa.controller';
import { User } from '../users/user.entity';
import { BabyCaregiver } from '../babies/baby-caregiver.entity';
import { Baby } from '../babies/baby.entity';
import { Feeding } from '../feedings/feeding.entity';
import { SleepLog } from '../sleep/sleep.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, BabyCaregiver, Baby, Feeding, SleepLog]),
  ],
  controllers: [AlexaController],
  providers: [AlexaService],
  exports: [AlexaService],
})
export class AlexaModule {}
