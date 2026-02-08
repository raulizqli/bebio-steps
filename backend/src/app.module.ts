import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { getDatabaseConfig } from './config/database.config';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AuthModule } from './modules/auth/auth.module';
import { BabiesModule } from './modules/babies/babies.module';
import { SharingModule } from './modules/sharing/sharing.module';
import { FeedingsModule } from './modules/feedings/feedings.module';
import { SleepModule } from './modules/sleep/sleep.module';
import { MealsModule } from './modules/meals/meals.module';
import { SymptomsModule } from './modules/symptoms/symptoms.module';
import { MedicinesModule } from './modules/medicines/medicines.module';
import { MoodModule } from './modules/mood/mood.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AlexaModule } from './modules/alexa/alexa.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    BabiesModule,
    SharingModule,
    FeedingsModule,
    SleepModule,
    MealsModule,
    SymptomsModule,
    MedicinesModule,
    MoodModule,
    NotificationsModule,
    AlexaModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
