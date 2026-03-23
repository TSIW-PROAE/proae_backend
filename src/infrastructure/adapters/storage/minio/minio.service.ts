import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Client } from 'minio';
import { MINIO_CONNECTION } from 'nestjs-minio';
import * as path from 'path';
import * as crypto from 'crypto';
import type { Readable } from 'stream';
import type {
  FileStoragePort,
  ObjectStreamResult,
  UploadDocumentsResult,
} from '../../../../core/application/utilities/ports/file-storage.port';

@Injectable()
export class MinioClientService implements FileStoragePort {
  constructor(@Inject(MINIO_CONNECTION) private readonly minioClient: Client) {}

  private get bucket(): string {
    return process.env.MINIO_BUCKET as string;
  }

  async uploadDocuments(
    userId: string | number,
    files: Express.Multer.File[],
  ): Promise<UploadDocumentsResult> {
    try {
      const uid = String(userId);
      const uploadResults = await Promise.all(
        files.map(async (file) => {
          const ext = path.extname(file.originalname) || '';
          const uniqueId = crypto.randomUUID().slice(0, 8);
          const timestamp = Date.now();
          const objectKey = `${uid}/documentos/${timestamp}_${uniqueId}${ext}`;

          const metaData = {
            'Content-Type': file.mimetype,
            'X-Original-Filename': Buffer.from(
              file.originalname.normalize('NFC'),
            ).toString('base64'),
          };

          await this.minioClient.putObject(
            this.bucket,
            objectKey,
            file.buffer,
            file.size,
            metaData,
          );

          return {
            nome_do_arquivo: file.originalname,
            tipo: file.mimetype,
            objectKey,
          };
        }),
      );

      return {
        mensagem: 'Upload feito com sucesso!',
        arquivos: uploadResults,
        objectKey: uploadResults[0]?.objectKey ?? null,
      };
    } catch (e) {
      console.error(e);
      throw new BadRequestException('Erro ao fazer upload dos arquivos');
    }
  }

  async getDocument(
    userId: string | number,
    filename: string,
  ): Promise<{ nome_do_arquivo: string; url: string }> {
    const objectKey = `${userId}/documentos/${filename.normalize('NFC')}`;
    const r = await this.getDocumentByKey(objectKey);
    return { nome_do_arquivo: filename, url: r.url };
  }

  async getDocumentByKey(objectKey: string): Promise<{
    objectKey: string;
    url: string;
    nome_do_arquivo?: string;
  }> {
    try {
      await this.minioClient.statObject(this.bucket, objectKey);
      const url = await this.minioClient.presignedUrl(
        'GET',
        this.bucket,
        objectKey,
        24 * 60 * 60,
      );
      return { objectKey, url };
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err?.code === 'NotFound') {
        throw new NotFoundException(`Arquivo não encontrado: ${objectKey}`);
      }
      console.error(e);
      throw new BadRequestException('Erro ao gerar URL do arquivo');
    }
  }

  async streamObject(
    objectKey: string,
    userId?: string | number,
  ): Promise<ObjectStreamResult> {
    const resolved = this.resolveObjectKey(objectKey, userId);
    try {
      return await this.fetchStream(resolved);
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err?.code === 'NotFound') {
        const nfcKey = resolved.normalize('NFC');
        if (nfcKey !== resolved) {
          try {
            return await this.fetchStream(nfcKey);
          } catch {
            // fall through
          }
        }
        throw new NotFoundException(`Arquivo não encontrado: ${resolved}`);
      }
      console.error(e);
      throw new BadRequestException('Erro ao recuperar arquivo');
    }
  }

  async deleteObject(objectKey: string): Promise<void> {
    if (!objectKey) return;
    try {
      await this.minioClient.removeObject(this.bucket, objectKey);
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err?.code === 'NotFound') {
        return;
      }
      console.error(e);
    }
  }

  private resolveObjectKey(key: string, userId?: string | number): string {
    if (key.includes('/')) {
      return key;
    }
    if (userId !== undefined && userId !== null) {
      return `${userId}/documentos/${key}`;
    }
    return key;
  }

  private async fetchStream(
    objectKey: string,
  ): Promise<ObjectStreamResult> {
    const stat = await this.minioClient.statObject(this.bucket, objectKey);
    const stream = await this.minioClient.getObject(this.bucket, objectKey);
    return {
      stream: stream as Readable,
      contentType:
        stat.metaData?.['content-type'] || 'application/octet-stream',
      size: stat.size,
    };
  }
}
