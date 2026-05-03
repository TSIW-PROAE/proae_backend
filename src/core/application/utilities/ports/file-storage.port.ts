import type { Readable } from 'stream';

export interface UploadedArquivoInfo {
  nome_do_arquivo: string;
  tipo: string;
  /** Chave completa no bucket (ex.: userId/documentos/timestamp_uuid.pdf) */
  objectKey: string;
  url?: string;
}

export interface UploadDocumentsResult {
  mensagem: string;
  arquivos: UploadedArquivoInfo[];
  /** Primeira chave (compatibilidade com fluxos que esperam um único arquivo) */
  objectKey?: string | null;
}

export interface ObjectStreamResult {
  stream: Readable;
  contentType: string;
  size: number;
}

export interface FileStoragePort {
  uploadDocuments(
    userId: string | number,
    files: Express.Multer.File[],
  ): Promise<UploadDocumentsResult>;

  /** Legado: só filename dentro de userId/documentos/ */
  getDocument(
    userId: string | number,
    filename: string,
  ): Promise<{ nome_do_arquivo: string; url: string }>;

  /** Presigned GET pela chave completa no bucket */
  getDocumentByKey(objectKey: string): Promise<{
    objectKey: string;
    url: string;
    nome_do_arquivo?: string;
  }>;

  streamObject(
    objectKey: string,
    userId?: string | number,
  ): Promise<ObjectStreamResult>;

  deleteObject(objectKey: string): Promise<void>;
}
