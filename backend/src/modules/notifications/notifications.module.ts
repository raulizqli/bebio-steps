import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { BabyGoal } from '../babies/baby-goal.entity';
import { BabyCaregiver } from '../babies/baby-caregiver.entity';
import { Feeding } from '../feedings/feeding.entity';
import { SleepLog } from '../sleep/sleep.entity';
import { User } from '../users/user.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      BabyGoal,
      BabyCaregiver,
      Feeding,
      SleepLog,
      User,
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
