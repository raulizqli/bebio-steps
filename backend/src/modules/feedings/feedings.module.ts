import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Feeding } from './feeding.entity';
import { FeedingsService } from './feedings.service';
import { FeedingsController } from './feedings.controller';
import { BabiesModule } from '../babies/babies.module';

@Module({
  imports: [TypeOrmModule.forFeature([Feeding]), BabiesModule],
  controllers: [FeedingsController],
  providers: [FeedingsService],
  exports: [FeedingsService],
})
export class FeedingsModule {}
