import { BadRequestException, Injectable } from '@nestjs/common';
import type { FileStoragePort } from '../../../../core/application/utilities/ports/file-storage.port';

const MSG = 'MinIO não está configurado ou indisponível. Configure MINIO_* ou inicie o serviço.';

/**
 * Stub usado quando MinIO não está configurado ou não deve conectar na inicialização.
 * Evita ECONNREFUSED no startup (ex.: desenvolvimento local sem MinIO).
 */
@Injectable()
export class MinioStubService implements FileStoragePort {
  async uploadDocuments(): Promise<{ mensagem: string; arquivos: Array<{ nome_do_arquivo: string; tipo: string }> }> {
    throw new BadRequestException(MSG);
  }

  async getDocument(): Promise<{ nome_do_arquivo: string; url: string }> {
    throw new BadRequestException(MSG);
  }
}
