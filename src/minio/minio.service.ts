import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import type { Client } from 'minio';
import { MINIO_CONNECTION } from 'nestjs-minio';
import { Readable } from 'stream';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class MinioClientService implements OnModuleInit {
  private readonly logger = new Logger(MinioClientService.name);

  constructor(@Inject(MINIO_CONNECTION) private readonly minioClient: Client) {}

  private get bucket(): string {
    return process.env.MINIO_BUCKET as string;
  }

  /**
   * Garante que o bucket existe ao iniciar o módulo.
   */
  async onModuleInit() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucket);
      if (!exists) {
        this.logger.warn(
          `Bucket "${this.bucket}" não encontrado. Verifique se o bucket existe no Google Cloud Storage.`,
        );
      } else {
        this.logger.log(`Bucket "${this.bucket}" encontrado e acessível.`);
      }
    } catch (e) {
      this.logger.error(
        `Erro ao verificar bucket "${this.bucket}". Verifique as credenciais e o endpoint:`,
        e,
      );
    }
  }

  /**
   * Faz upload de arquivos no MinIO e retorna os object keys completos.
   * O objectKey usa UUID para evitar problemas de encoding com caracteres especiais.
   * Formato: {userId}/documentos/{timestamp}_{uuid8}.{ext}
   */
  async uploadDocuments(userId: string, files: Express.Multer.File[]) {
    try {
      const uploadResults = await Promise.all(
        files.map(async (file) => {
          const metaData = {
            'Content-Type': file.mimetype,
            // Armazena o nome original no metadata para referência
            'X-Original-Filename': Buffer.from(
              file.originalname.normalize('NFC'),
            ).toString('base64'),
          };

          // Usar UUID + extensão para evitar problemas de encoding
          const ext = path.extname(file.originalname) || '';
          const uniqueId = crypto.randomUUID().slice(0, 8);
          const timestamp = Date.now();
          const objectKey = `${userId}/documentos/${timestamp}_${uniqueId}${ext}`;

          await this.minioClient.putObject(
            this.bucket,
            objectKey,
            file.buffer,
            file.size,
            metaData,
          );

          this.logger.log(
            `Upload OK: "${file.originalname}" -> "${objectKey}"`,
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
        objectKey: uploadResults[0]?.objectKey || null,
        urlArquivo: uploadResults[0]?.objectKey || null,
      };
    } catch (e) {
      this.logger.error('Erro ao fazer upload no MinIO:', e);
      throw new BadRequestException('Erro ao fazer upload dos arquivos');
    }
  }

  /**
   * Gera uma URL presigned para um arquivo usando userId + filename (legado).
   */
  async getDocument(userId: string, filename: string) {
    const objectKey = `${userId}/documentos/${filename.normalize('NFC')}`;
    return this.getDocumentByKey(objectKey);
  }

  /**
   * Gera uma URL presigned a partir do objectKey completo armazenado no banco.
   */
  async getDocumentByKey(objectKey: string) {
    try {
      await this.minioClient.statObject(this.bucket, objectKey);

      const presignedUrl = await this.minioClient.presignedUrl(
        'GET',
        this.bucket,
        objectKey,
        24 * 60 * 60, // 24 horas
      );

      return {
        objectKey,
        url: presignedUrl,
      };
    } catch (e: any) {
      if (e?.code === 'NotFound') {
        throw new NotFoundException(`Arquivo não encontrado: ${objectKey}`);
      }
      this.logger.error('Erro ao gerar URL presigned:', e);
      throw new BadRequestException('Erro ao gerar URL do arquivo');
    }
  }

  /**
   * Retorna o stream do objeto e seus metadados (Content-Type, tamanho).
   * Usado pelo endpoint de proxy/view para servir o arquivo ao navegador.
   *
   * Se objectKey não contém "/" (dado legado = só filename), reconstrói
   * usando userId + "documentos/" + filename.
   */
  async getObjectStream(
    objectKey: string,
    userId?: string,
  ): Promise<{ stream: Readable; contentType: string; size: number }> {
    // Se for apenas um filename (sem "/"), reconstrói o caminho completo
    const resolvedKey = this.resolveObjectKey(objectKey, userId);

    try {
      return await this.fetchStream(resolvedKey);
    } catch (e: any) {
      // Se falhar com a chave resolvida e temos userId, tenta NFC-normalizado
      if (e?.code === 'NotFound' || e?.status === 404) {
        const nfcKey = resolvedKey.normalize('NFC');
        if (nfcKey !== resolvedKey) {
          this.logger.warn(
            `Tentando chave NFC-normalizada: "${nfcKey}" (original: "${resolvedKey}")`,
          );
          try {
            return await this.fetchStream(nfcKey);
          } catch {
            // cai no throw abaixo
          }
        }
        throw new NotFoundException(`Arquivo não encontrado: ${resolvedKey}`);
      }
      this.logger.error('Erro ao obter arquivo do MinIO:', e);
      throw new BadRequestException('Erro ao recuperar arquivo');
    }
  }

  /**
   * Resolve um objectKey: se já é completo (contém "/"), usa direto.
   * Se é só um filename legado, reconstrói com userId.
   */
  private resolveObjectKey(key: string, userId?: string): string {
    if (key.includes('/')) {
      return key;
    }
    if (userId) {
      return `${userId}/documentos/${key}`;
    }
    // Sem "/" e sem userId, tenta usar a string direta
    return key;
  }

  /**
   * Remove um objeto do MinIO. Usado ao reenviar um arquivo, para excluir o antigo.
   * Silencia erros de "NotFound" — se o arquivo já não existe, não há nada a fazer.
   */
  async deleteObject(objectKey: string): Promise<void> {
    if (!objectKey) return;
    try {
      await this.minioClient.removeObject(this.bucket, objectKey);
      this.logger.log(`Objeto removido do MinIO: "${objectKey}"`);
    } catch (e: any) {
      if (e?.code === 'NotFound') {
        this.logger.warn(`Objeto já não existia no MinIO: "${objectKey}"`);
        return;
      }
      this.logger.error(`Erro ao remover objeto "${objectKey}":`, e);
      // Não relança — a deleção do arquivo antigo não deve bloquear o reenvio
    }
  }

  /**
   * Busca o stream e metadados de um objeto no MinIO.
   */
  private async fetchStream(
    objectKey: string,
  ): Promise<{ stream: Readable; contentType: string; size: number }> {
    const stat = await this.minioClient.statObject(this.bucket, objectKey);
    const stream = await this.minioClient.getObject(this.bucket, objectKey);

    return {
      stream,
      contentType:
        stat.metaData?.['content-type'] || 'application/octet-stream',
      size: stat.size,
    };
  }
}
