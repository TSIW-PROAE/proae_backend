import { DynamicModule, Module } from '@nestjs/common';
import { FILE_STORAGE } from '../../../../core/application/utilities/utility.tokens';
import { R2StorageService } from './r2-storage.service';
import { StorageStubService } from './storage-stub.service';

function isR2Configured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY
  );
}

@Module({})
export class R2StorageModule {
  static forRoot(): DynamicModule {
    const useR2 = isR2Configured();
    if (useR2) {
      return {
        module: R2StorageModule,
        global: true,
        providers: [
          R2StorageService,
          { provide: FILE_STORAGE, useExisting: R2StorageService },
        ],
        exports: [FILE_STORAGE, R2StorageService],
      };
    }
    console.warn(
      '⚠️ R2 não configurado (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY). Upload de documentos retornará erro até configurar.',
    );
    return {
      module: R2StorageModule,
      global: true,
      providers: [
        StorageStubService,
        { provide: FILE_STORAGE, useExisting: StorageStubService },
        { provide: R2StorageService, useExisting: StorageStubService },
      ],
      exports: [FILE_STORAGE, R2StorageService],
    };
  }
}
