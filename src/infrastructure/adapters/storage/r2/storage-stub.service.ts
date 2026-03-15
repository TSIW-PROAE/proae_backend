import { BadRequestException, Injectable } from '@nestjs/common';
import type { FileStoragePort } from '../../../../core/application/utilities/ports/file-storage.port';

const MSG =
  'Storage (R2) não está configurado. Configure R2_ACCOUNT_ID, R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY.';

@Injectable()
export class StorageStubService implements FileStoragePort {
  async uploadDocuments(): Promise<{
    mensagem: string;
    arquivos: Array<{ nome_do_arquivo: string; tipo: string }>;
  }> {
    throw new BadRequestException(MSG);
  }

  async getDocument(): Promise<{ nome_do_arquivo: string; url: string }> {
    throw new BadRequestException(MSG);
  }
}
