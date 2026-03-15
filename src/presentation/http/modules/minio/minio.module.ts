import { Module } from '@nestjs/common';
import { MinioClientController } from './minio.controller';

@Module({
  controllers: [MinioClientController],
})
export class MinioHttpModule {}
