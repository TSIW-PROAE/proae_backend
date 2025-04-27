import { Module } from '@nestjs/common';
import { MinioModule } from 'nestjs-minio-client';
import { MinioClientService } from './minio-client.service';
import { config } from 'dotenv';
import { MinioClientController } from './minio-client.controller';

config();

@Module({
  imports: [
    MinioModule.register({
      endPoint: process.env.MINIO_ENDPOINT,
      port: parseInt(process.env.MINIO_PORT),
      useSSL: true,
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
    }),
  ],
  providers: [MinioClientService],
  controllers: [MinioClientController],
  exports: [MinioClientService],
})
export class MinioClientModule {}
