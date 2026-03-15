import { Module } from '@nestjs/common';
import { RedisModule } from './adapters/cache/redis/redis.module';
import { PdfModule } from './adapters/pdf/pdf.module';
import { R2StorageModule } from './adapters/storage/r2/r2-storage.module';

@Module({
  imports: [RedisModule, R2StorageModule.forRoot(), PdfModule],
  exports: [RedisModule, R2StorageModule, PdfModule],
})
export class InfrastructureModule {}
