import { Module, forwardRef } from '@nestjs/common';
import { NestMinioModule } from 'nestjs-minio';
import { FILE_STORAGE } from '../../../../core/application/utilities/utility.tokens';
import { AuthModule } from '../../../../presentation/http/modules/auth/auth.module';
import { MinioClientService } from './minio.service';

@Module({
  imports: [
    NestMinioModule.register({
      isGlobal: true,
      endPoint: process.env.MINIO_ENDPOINT as string,
      useSSL: false,
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
      port: parseInt(process.env.MINIO_PORT || '443', 10),
    }),
    forwardRef(() => AuthModule),
  ],
  providers: [
    MinioClientService,
    { provide: FILE_STORAGE, useExisting: MinioClientService },
  ],
  exports: [FILE_STORAGE, MinioClientService],
})
export class MinioClientModule {}
