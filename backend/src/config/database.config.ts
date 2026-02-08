import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 5432),
  username: configService.get<string>('DB_USERNAME', 'postgres'),
  password: configService.get<string>('DB_PASSWORD', 'postgres'),
  database: configService.get<string>('DB_DATABASE', 'bebio_steps'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: configService.get<string>('APP_ENV', 'development') === 'development',
  logging: configService.get<string>('APP_ENV', 'development') === 'development',
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
});
