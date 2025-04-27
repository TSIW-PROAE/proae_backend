import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { MinioService } from 'nestjs-minio-client';
import * as crypto from 'crypto';
import { config } from 'dotenv';
import { Readable } from 'stream';
import { BufferedFile } from './file.model';

config();

@Injectable()
export class MinioClientService {
  private readonly logger: Logger;
  private readonly baseBucket = process.env.MINIO_BUCKET;

  public get client() {
    return this.minio.client;
  }

  constructor(private readonly minio: MinioService) {
    this.logger = new Logger('MinioStorageService');
  }

  async upload_files(files: { [key: string]: BufferedFile[] }, bucket: string) {
    try {
      const uploadedUrls: { [key: string]: string } = {};
      if (!bucket) {
        throw new NotFoundException('O bucket precisa ser informado');
      }
      await this.createBucketIfNotExists(bucket);
      for (const key in files) {
        const file = files[key][0];
        if (
          !(
            file.mimetype.endsWith('/jpeg') ||
            file.mimetype.endsWith('/png') ||
            file.mimetype.endsWith('/pdf')
          )
        ) {
          throw new BadRequestException('Tipo de arquivo não suportado');
        }
        const temp_filename = Date.now().toString();
        const hashedFileName = crypto
          .createHash('md5')
          .update(temp_filename)
          .digest('hex');
        const ext = file.originalname.substring(
          file.originalname.lastIndexOf('.'),
          file.originalname.length,
        );
        const metaData = {
          'Content-Type': file.mimetype,
          'X-Amz-Meta-Testing': 1234,
        };
        const filename = hashedFileName + ext;
        const fileName: string = `${filename}`;
        const fileBuffer = file.buffer;
        await this.client.putObject(bucket, fileName, fileBuffer, metaData);
        uploadedUrls[key] =
          `${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${process.env.MINIO_BUCKET}/${filename}`;
      }

      return {
        message: 'Upload feito com sucesso!',
        url: uploadedUrls,
      };
    } catch (error) {
      const e = error as Error;
      console.error('Erro ao fazer upload dos documentos:', error);
      throw new BadRequestException(
        `Erro ao fazer upload dos documentos: ${e.message}`,
      );
    }
  }

  async download_file(
    filename: string,
    bucket: string,
  ): Promise<{ stream: Readable; url: string }> {
    try {
      if (!bucket) {
        throw new NotFoundException('O bucket precisa ser informado.');
      }
      await this.createBucketIfNotExists(bucket);
      const fileStream = await this.client.getObject(bucket, filename);
      const fileUrl = `${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${bucket}/${filename}`;

      return { stream: fileStream, url: fileUrl };
    } catch (error) {
      const e = error as Error;
      console.error('Erro ao fazer download do arquivo:', error);
      throw new BadRequestException(
        `Erro ao fazer download do arquivo: ${e.message}`,
      );
    }
  }
  async createBucketIfNotExists(bucket: string): Promise<void> {
    try {
      const bucketExists = await this.client.bucketExists(bucket);
      if (!bucketExists) {
        await this.client.makeBucket(bucket, 'us-east-1');
        this.logger.log(`Bucket "${bucket}" criado com sucesso.`);
      }
    } catch (error) {
      const e = error as Error;
      console.error('Erro ao criar/verificar bucket:', error);
      throw new BadRequestException(
        `Erro ao criar/verificar bucket: ${e.message}`,
      );
    }
  }
  async deleteBucketIfExists(bucket: string): Promise<void> {
    try {
      const bucketExists = await this.client.bucketExists(bucket);
      if (bucketExists) {
        await this.client.removeBucket(bucket);
        this.logger.log(`Bucket "${bucket}" excluído com sucesso.`);
      }
    } catch (error) {
      const e = error as Error;
      console.error('Erro ao excluir o bucket:', error);
      throw new BadRequestException(`Erro ao excluir o bucket: ${e.message}`);
    }
  }
}
