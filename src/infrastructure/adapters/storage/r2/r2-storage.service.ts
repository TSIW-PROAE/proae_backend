import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as crypto from 'crypto';
import * as path from 'path';
import type { Readable } from 'stream';
import type {
  FileStoragePort,
  ObjectStreamResult,
  UploadDocumentsResult,
} from '../../../../core/application/utilities/ports/file-storage.port';

const PRESIGN_EXPIRES_IN = 24 * 60 * 60; // 24h

function getR2ErrorCode(err: unknown): string | undefined {
  if (err && typeof err === 'object') {
    const o = err as { Code?: string; name?: string };
    return o.Code ?? o.name;
  }
  return undefined;
}

@Injectable()
export class R2StorageService implements FileStoragePort {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor() {
    let accountId = (process.env.R2_ACCOUNT_ID ?? '').trim();
    const accessKeyId = (process.env.R2_ACCESS_KEY_ID ?? '').trim();
    const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY ?? '').trim();
    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'R2_ACCOUNT_ID, R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY são obrigatórios para R2.',
      );
    }
    if (accountId.includes('.') || accountId.startsWith('http')) {
      const withoutUrl = accountId.replace(/^https?:\/\//, '').split('/')[0];
      const match = withoutUrl.match(/([a-f0-9]{32})/i);
      if (match) accountId = match[1];
      else
        accountId =
          withoutUrl
            .split('.')
            .filter((s) => s !== 'r2' && s !== 'cloudflarestorage' && s !== 'com')
            .pop() ?? accountId;
    }
    this.bucket = (process.env.R2_BUCKET_NAME || 'proae-documentos')
      .trim()
      .replace(/=+$/, '');
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
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

          await this.s3.send(
            new PutObjectCommand({
              Bucket: this.bucket,
              Key: objectKey,
              Body: file.buffer,
              ContentType: file.mimetype,
            }),
          );

          const url = await getSignedUrl(
            this.s3,
            new GetObjectCommand({ Bucket: this.bucket, Key: objectKey }),
            { expiresIn: PRESIGN_EXPIRES_IN },
          );

          return {
            nome_do_arquivo: file.originalname,
            tipo: file.mimetype,
            objectKey,
            url,
          };
        }),
      );

      return {
        mensagem: 'Upload feito com sucesso!',
        arquivos: uploadResults,
        objectKey: uploadResults[0]?.objectKey ?? null,
      };
    } catch (e) {
      const code = getR2ErrorCode(e);
      if (
        code === 'Unauthorized' ||
        code === 'AccessDenied' ||
        code === 'Forbidden'
      ) {
        throw new ForbiddenException(
          'Storage (R2): não autorizado (401). Crie um novo token em R2 → Manage → Create Account API token (Object Read & Write) e atualize R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY no .env.',
        );
      }
      if (code === 'NoSuchBucket') {
        throw new BadRequestException(
          `Storage (R2): bucket "${this.bucket}" não existe. Crie o bucket no painel R2 ou ajuste R2_BUCKET_NAME.`,
        );
      }
      if (code === 'InvalidAccessKeyId') {
        throw new ForbiddenException(
          'Storage (R2): R2_ACCESS_KEY_ID inválido. No painel Cloudflare R2, vá em "Manage" (API Tokens), crie ou copie o Access Key ID e cole no .env sem espaços.',
        );
      }
      if (code === 'SignatureDoesNotMatch') {
        throw new ForbiddenException(
          'Storage (R2): R2_SECRET_ACCESS_KEY incorreto. Copie de novo o Secret do token em "Manage" (sem espaço/quebra). Se ainda falhar, crie um novo token e atualize as duas variáveis.',
        );
      }
      console.error('[R2 upload]', e);
      throw new BadRequestException(
        'Erro ao fazer upload dos arquivos. Tente novamente ou verifique a configuração do R2.',
      );
    }
  }

  async getDocument(
    userId: string | number,
    filename: string,
  ): Promise<{ nome_do_arquivo: string; url: string }> {
    const key = `${userId}/documentos/${filename}`;
    const { url } = await this.getDocumentByKey(key);
    return { nome_do_arquivo: filename, url };
  }

  async getDocumentByKey(objectKey: string): Promise<{
    objectKey: string;
    url: string;
    nome_do_arquivo?: string;
  }> {
    try {
      await this.s3.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: objectKey,
        }),
      );
      const url = await getSignedUrl(
        this.s3,
        new GetObjectCommand({ Bucket: this.bucket, Key: objectKey }),
        { expiresIn: PRESIGN_EXPIRES_IN },
      );
      return { objectKey, url };
    } catch (e) {
      const code = getR2ErrorCode(e);
      if (code === 'NoSuchKey' || code === 'NotFound') {
        throw new NotFoundException(`Arquivo não encontrado: ${objectKey}`);
      }
      if (
        code === 'Unauthorized' ||
        code === 'AccessDenied' ||
        code === 'Forbidden'
      ) {
        throw new ForbiddenException(
          'Storage (R2): não autorizado. Atualize R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY com um token válido.',
        );
      }
      console.error('[R2 getDocumentByKey]', e);
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
      const code = getR2ErrorCode(e);
      if (code === 'NoSuchKey' || code === 'NotFound') {
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
      console.error('[R2 streamObject]', e);
      throw new BadRequestException('Erro ao recuperar arquivo');
    }
  }

  async deleteObject(objectKey: string): Promise<void> {
    if (!objectKey) return;
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: objectKey,
        }),
      );
    } catch (e) {
      const code = getR2ErrorCode(e);
      if (code === 'NoSuchKey' || code === 'NotFound') {
        return;
      }
      console.error('[R2 deleteObject]', e);
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

  private async fetchStream(objectKey: string): Promise<ObjectStreamResult> {
    const head = await this.s3.send(
      new HeadObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
      }),
    );
    const out = await this.s3.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
      }),
    );
    const stream = out.Body as Readable;
    const size = Number(head.ContentLength ?? 0);
    const contentType =
      head.ContentType ||
      out.ContentType ||
      'application/octet-stream';
    return { stream, contentType, size };
  }
}
