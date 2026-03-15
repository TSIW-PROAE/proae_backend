import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './presentation/http/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const defaultAllowedOrigins = [
    'https://proae-frontend.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
  ];
  const allowedOrigins = (
    process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()) ??
    defaultAllowedOrigins
  ).filter(Boolean);

  // Configuração do cookie parser
  app.use(cookieParser());

  // Configuração do CORS
  app.enableCors({
    origin: (origin, callback) => {
      // Permite chamadas sem Origin (health checks/server-to-server)
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin não permitida por CORS: ${origin}`), false);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
    optionsSuccessStatus: 204,
    preflightContinue: false,
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
      .setTitle('API Sistema Proae')
      .setDescription('A Documentação da API do sistema proae.')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
      customSiteTitle: 'API PROAE',
      customfavIcon: '/favicon.ico',
      customJs: [
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js',
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js',
      ],
      customCssUrl: [
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.css',
      ],
    });
  } catch (error) {
    console.error('Erro ao configurar Swagger:', error);
  }

  // Aplicando o filter globalmente
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT || 3000;
  const server = await app.listen(port, '0.0.0.0'); // Escuta em todas as interfaces

  // Ajustes recomendados pelo Render: evita ECONNRESET/socket hang up
  // por keep-alive e timeouts do load balancer (default 5s é curto)
  const httpServer = server as import('http').Server;
  if (httpServer && 'keepAliveTimeout' in httpServer) {
    httpServer.keepAliveTimeout = 65000; // 65s
    httpServer.headersTimeout = 66000;   // > keepAliveTimeout
  }

  console.log(`✅ Aplicação rodando na porta ${port}`);
}

// Trata rejeições e exceções não capturadas para evitar crash por ECONNRESET
// (ex.: falha em requisição HTTP para Upstash Redis, MinIO, etc.)
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  const msg =
    reason instanceof Error
      ? reason.message
      : typeof reason === 'object' && reason !== null
        ? JSON.stringify(reason)
        : String(reason);
  const stack = reason instanceof Error ? reason.stack : undefined;
  console.error('[unhandledRejection]', msg, stack ?? '');
});

process.on('uncaughtException', (err: Error) => {
  console.error('[uncaughtException]', err.message, err.stack);
  process.exit(1);
});

bootstrap();
