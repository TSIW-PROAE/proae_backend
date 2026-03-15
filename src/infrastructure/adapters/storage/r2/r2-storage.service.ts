import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { FileStoragePort } from '../../../../core/application/utilities/ports/file-storage.port';

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
    // Usar só o Account ID: se vier URL ou host (ex: proae-backend.xxx ou https://...r2.cloudflarestorage.com), extrair o ID
    if (accountId.includes('.') || accountId.startsWith('http')) {
      const withoutUrl = accountId.replace(/^https?:\/\//, '').split('/')[0];
      const match = withoutUrl.match(/([a-f0-9]{32})/i);
      if (match) accountId = match[1];
      else accountId = withoutUrl.split('.').filter((s) => s !== 'r2' && s !== 'cloudflarestorage' && s !== 'com').pop() ?? accountId;
    }
    this.bucket = (process.env.R2_BUCKET_NAME || 'proae-documentos').trim().replace(/=+$/, '');
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
  ): Promise<{ mensagem: string; arquivos: Array<{ nome_do_arquivo: string; tipo: string; url?: string }> }> {
    try {
      const uploadResults = await Promise.all(
        files.map(async (file) => {
          const key = `${userId}/documentos/${file.originalname}`;
          await this.s3.send(
            new PutObjectCommand({
              Bucket: this.bucket,
              Key: key,
              Body: file.buffer,
              ContentType: file.mimetype,
            }),
          );
          const url = await getSignedUrl(
            this.s3,
            new GetObjectCommand({ Bucket: this.bucket, Key: key }),
            { expiresIn: PRESIGN_EXPIRES_IN },
          );
          return {
            nome_do_arquivo: file.originalname,
            tipo: file.mimetype,
            url,
          };
        }),
      );
      return {
        mensagem: 'Upload feito com sucesso!',
        arquivos: uploadResults,
      };
    } catch (e) {
      const code = getR2ErrorCode(e);
      if (code === 'Unauthorized' || code === 'AccessDenied' || code === 'Forbidden') {
        throw new ForbiddenException(
          'Storage (R2): não autorizado (401). Crie um novo token em R2 → Manage → Create Account API token (Object Read & Write) e atualize R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY no .env. O Secret só aparece uma vez ao criar.',
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
    try {
      const key = `${userId}/documentos/${filename}`;
      await this.s3.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      const url = await getSignedUrl(
        this.s3,
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
        { expiresIn: PRESIGN_EXPIRES_IN },
      );
      return {
        nome_do_arquivo: filename,
        url,
      };
    } catch (e) {
      const code = getR2ErrorCode(e);
      if (code === 'Unauthorized' || code === 'AccessDenied' || code === 'Forbidden') {
        throw new ForbiddenException(
          'Storage (R2): não autorizado. Atualize R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY com um token válido (Create Account API token no painel R2).',
        );
      }
      if (code === 'NoSuchKey' || code === 'NotFound') {
        throw new BadRequestException('Arquivo não encontrado no storage.');
      }
      if (code === 'InvalidAccessKeyId') {
        throw new ForbiddenException(
          'Storage (R2): R2_ACCESS_KEY_ID inválido. Verifique no painel R2 → Manage API Tokens.',
        );
      }
      if (code === 'SignatureDoesNotMatch') {
        throw new ForbiddenException(
          'Storage (R2): R2_SECRET_ACCESS_KEY incorreto. Copie o Secret de novo ou crie um novo token.',
        );
      }
      console.error('[R2 getDocument]', e);
      throw new BadRequestException(
        'Erro ao gerar URL do arquivo. Verifique a configuração do R2.',
      );
    }
  }
}
