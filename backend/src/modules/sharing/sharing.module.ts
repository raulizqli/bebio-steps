import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invite } from './invite.entity';
import { BabyCaregiver } from '../babies/baby-caregiver.entity';
import { SharingService } from './sharing.service';
import { SharingController } from './sharing.controller';
import { BabiesModule } from '../babies/babies.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invite, BabyCaregiver]),
    BabiesModule,
  ],
  controllers: [SharingController],
  providers: [SharingService],
  exports: [SharingService],
})
export class SharingModule {}
