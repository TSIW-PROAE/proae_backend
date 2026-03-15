import { DynamicModule, Module, forwardRef } from '@nestjs/common';
import { NestMinioModule } from 'nestjs-minio';
import { FILE_STORAGE } from '../../../../core/application/utilities/utility.tokens';
import { AuthModule } from '../../../../presentation/http/modules/auth/auth.module';
import { MinioClientService } from './minio.service';
import { MinioStubService } from './minio-stub.service';

function isMinioConfigured(): boolean {
  return !!(
    process.env.MINIO_ENDPOINT &&
    process.env.MINIO_ACCESS_KEY &&
    process.env.MINIO_SECRET_KEY
  );
}

@Module({})
export class MinioClientModule {
  static forRoot(): DynamicModule {
    const useMinio = isMinioConfigured();
    if (useMinio) {
      return {
        module: MinioClientModule,
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
      };
    }
    console.warn(
      '⚠️ MinIO não configurado (MINIO_ENDPOINT/ACCESS_KEY/SECRET_KEY). Upload de documentos retornará erro até configurar.',
    );
    return {
      module: MinioClientModule,
      imports: [forwardRef(() => AuthModule)],
      providers: [
        MinioStubService,
        { provide: MinioClientService, useExisting: MinioStubService },
        { provide: FILE_STORAGE, useExisting: MinioStubService },
      ],
      exports: [FILE_STORAGE, MinioClientService],
    };
  }
}
