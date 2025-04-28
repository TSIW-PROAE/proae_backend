import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { MINIO_CONNECTION } from 'nestjs-minio';
import type { Client } from 'minio';

@Injectable()
export class MinioClientService {
  constructor(@Inject(MINIO_CONNECTION) private readonly minioClient: Client) {}

  async uploadFiles(files: Express.Multer.File[]) {
    try {
      const uploadResults = await Promise.all(
        files.map(async (file) => {
          const metaData = {
            'Content-Type': file.mimetype,
          };

          await this.minioClient.putObject(
            process.env.MINIO_BUCKET as string,
            `documentos/${file.originalname}`,
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
}

//   async download_file(
//     filename: string,
//     bucket: string,
//   ): Promise<{ stream: Readable; url: string }> {
//     try {
//       if (!bucket) {
//         throw new NotFoundException('O bucket precisa ser informado.');
//       }
//       await this.createBucketIfNotExists(bucket);
//       const fileStream = await this.client.getObject(bucket, filename);
//       const fileUrl = `${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${bucket}/${filename}`;

//       return { stream: fileStream, url: fileUrl };
//     } catch (error) {
//       const e = error as Error;
//       console.error('Erro ao fazer download do arquivo:', error);
//       throw new BadRequestException(
//         `Erro ao fazer download do arquivo: ${e.message}`,
//       );
//     }
//   }
// }
