import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS configuration for mobile apps
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('BebIO Steps API')
    .setDescription(
      'API para la plataforma de seguimiento de bebés. ' +
      'Registra tomas, horas de sueño, comidas, síntomas, medicinas y estado de ánimo.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication and user management')
    .addTag('Babies', 'Baby profiles and goals')
    .addTag('Sharing & Invites', 'Share access with nannies and family')
    .addTag('Feedings', 'Bottle and breastfeeding tracking')
    .addTag('Sleep', 'Sleep and nap tracking')
    .addTag('Meals', 'Solid food and meal tracking')
    .addTag('Symptoms & Illnesses', 'Symptom and illness tracking')
    .addTag('Medicines', 'Medicine administration tracking')
    .addTag('Mood', 'Baby mood and behavior tracking')
    .addTag('Notifications', 'Push notifications and goal alerts')
    .addTag('Alexa', 'Alexa skill webhook')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.APP_PORT || 3000;
  await app.listen(port);
  console.log(`🍼 BebIO Steps API running on http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
