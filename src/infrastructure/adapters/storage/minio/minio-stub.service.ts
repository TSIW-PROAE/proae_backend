import { BadRequestException, Injectable } from '@nestjs/common';
import type { Readable } from 'stream';
import type {
  FileStoragePort,
  UploadDocumentsResult,
} from '../../../../core/application/utilities/ports/file-storage.port';

const MSG =
  'MinIO não está configurado ou indisponível. Configure MINIO_* ou inicie o serviço.';

/**
 * Stub usado quando MinIO não está configurado ou não deve conectar na inicialização.
 */
@Injectable()
export class MinioStubService implements FileStoragePort {
  async uploadDocuments(
    _userId: string | number,
    _files: Express.Multer.File[],
  ): Promise<UploadDocumentsResult> {
    throw new BadRequestException(MSG);
  }

  async getDocument(): Promise<{ nome_do_arquivo: string; url: string }> {
    throw new BadRequestException(MSG);
  }

  async getDocumentByKey(): Promise<{
    objectKey: string;
    url: string;
    nome_do_arquivo?: string;
  }> {
    throw new BadRequestException(MSG);
  }

  async streamObject(): Promise<{
    stream: Readable;
    contentType: string;
    size: number;
  }> {
    throw new BadRequestException(MSG);
  }

  async deleteObject(): Promise<void> {
    throw new BadRequestException(MSG);
  }
}
