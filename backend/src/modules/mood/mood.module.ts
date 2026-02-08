import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MoodLog } from './mood.entity';
import { MoodService } from './mood.service';
import { MoodController } from './mood.controller';
import { BabiesModule } from '../babies/babies.module';

@Module({
  imports: [TypeOrmModule.forFeature([MoodLog]), BabiesModule],
  controllers: [MoodController],
  providers: [MoodService],
  exports: [MoodService],
})
export class MoodModule {}
