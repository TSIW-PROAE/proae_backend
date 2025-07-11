import { Module } from '@nestjs/common';
import { NestMinioModule } from 'nestjs-minio';
import { MinioClientController } from './minio.controller';
import { MinioClientService } from './minio.service';

@Module({
  imports: [
    NestMinioModule.register({
      isGlobal: true,
      endPoint: process.env.MINIO_ENDPOINT as string,
      useSSL: process.env.MINIO_USE_SSL === undefined ? true : process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
      port: parseInt(process.env.MINIO_PORT || "443", 10),
    }),
  ],
  providers: [MinioClientService],
  controllers: [MinioClientController],
})
export class MinioClientModule {}
