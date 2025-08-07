import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { Client } from 'minio';
import { MINIO_CONNECTION } from 'nestjs-minio';

@Injectable()
export class MinioClientService {
  constructor(@Inject(MINIO_CONNECTION) private readonly minioClient: Client) {}

  async uploadDocuments(userId: number, files: Express.Multer.File[]) {
    try {
      const uploadResults = await Promise.all(
        files.map(async (file) => {
          const metaData = {
            'Content-Type': file.mimetype,
          };

          await this.minioClient.putObject(
            process.env.MINIO_BUCKET as string,
            `${userId}/documentos/${file.originalname}`,
            file.buffer,
            file.size,
            metaData,
          );

          return {
            nome_do_arquivo: file.originalname,
            tipo: file.mimetype,
          };
        }),
      );

      return {
        mensagem: 'Upload feito com sucesso!',
        arquivos: uploadResults,
      };
    } catch (e) {
      console.error(e);
      throw new BadRequestException('Erro ao fazer upload dos arquivos');
    }
  }

  async getDocument(userId: number, filename: string) {
    try {
      await this.minioClient.statObject(
        process.env.MINIO_BUCKET as string,
        `${userId}/documentos/${filename}`,
      );

      const presignedUrl = await this.minioClient.presignedUrl(
        'GET',
        process.env.MINIO_BUCKET as string,
        `${userId}/documentos/${filename}`,
        24 * 60 * 60,
      );

      return {
        nome_do_arquivo: filename,
        url: presignedUrl,
      };
    } catch (e) {
      console.error(e);
      throw new BadRequestException('Erro ao gerar URL do arquivo');
    }
  }
}
