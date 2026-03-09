import { Module } from '@nestjs/common';
import { RedisModule } from './adapters/cache/redis/redis.module';
import { PdfModule } from './adapters/pdf/pdf.module';
import { MinioClientModule } from './adapters/storage/minio/minio-client.module';

@Module({
  imports: [RedisModule, MinioClientModule, PdfModule],
  exports: [RedisModule, MinioClientModule, PdfModule],
})
export class InfrastructureModule {}
