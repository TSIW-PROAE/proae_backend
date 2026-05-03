import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from 'src/presentation/http/modules/auth/auth.module';
import { MinioClientController } from './minio.controller';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [MinioClientController],
})
export class MinioHttpModule {}
