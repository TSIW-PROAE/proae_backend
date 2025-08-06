import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuração do CORS
  app.enableCors({
    origin: true, // Permite todas as origens ou configure com um array de origens específicas
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  try {
    const config = new DocumentBuilder()
      .setTitle('API de Inscrição')
      .setDescription('A Documentação da API do sistema proae.')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('api', app, document);
  } catch (error) {
    console.error('Erro ao configurar Swagger:', error);
  }

  // Aplicando o filter globalmente
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Aplicação rodando na porta ${process.env.PORT ?? 3000}`);
}

bootstrap();
