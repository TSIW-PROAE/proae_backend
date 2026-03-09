import { Module } from '@nestjs/common';
import { MinioClientModule } from 'src/infrastructure/adapters/storage/minio/minio-client.module';
import { MinioClientController } from './minio.controller';

@Module({
  imports: [MinioClientModule],
  controllers: [MinioClientController],
})
export class MinioHttpModule {}
