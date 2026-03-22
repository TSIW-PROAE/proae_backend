import {
  Controller,
  FileTypeValidator,
  Get,
  Param,
  ParseFilePipe,
  Post,
  Query,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import AuthenticatedRequest from '../types/authenticated-request.interface';
import { MinioClientService } from './minio.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class MinioClientController {
  constructor(private readonly minioClientService: MinioClientService) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadDocuments(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: /png|jpeg|pdf/ })],
      }),
    )
    files: Express.Multer.File[],
    @Req() request: AuthenticatedRequest,
  ) {
    const { userId } = request.user;
    return this.minioClientService.uploadDocuments(userId, files);
  }

  /**
   * Endpoint proxy que serve o arquivo do MinIO diretamente ao navegador.
   * Aceita objectKey completo OU filename legado.
   * Se o key não contém "/", o userId do JWT é usado para reconstruir o path.
   * Ex: GET /documents/view?key=userId/documentos/1234_abc123.pdf
   */
  @Get('view')
  async viewDocument(
    @Query('key') objectKey: string,
    @Req() request: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    if (!objectKey) {
      throw new BadRequestException('Parâmetro "key" é obrigatório');
    }

    const { userId } = request.user;
    const { stream, contentType, size } =
      await this.minioClientService.getObjectStream(objectKey, userId);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', size.toString());
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'private, max-age=3600');

    stream.pipe(res);
  }

  /**
   * Gera uma URL presigned para um object key armazenado no banco.
   * Ex: GET /documents/presigned?key=userId/documentos/1234_abc123.pdf
   */
  @Get('presigned')
  async getPresignedUrl(@Query('key') objectKey: string) {
    if (!objectKey) {
      throw new BadRequestException('Parâmetro "key" é obrigatório');
    }

    return this.minioClientService.getDocumentByKey(objectKey);
  }

  /**
   * Endpoint legado: reconstrói path com userId do JWT + filename.
   * Se o filename já contém "/" (é um objectKey completo), usa direto.
   * GET /documents/:filename
   */
  @Get(':filename')
  async getDocument(
    @Param('filename') filename: string,
    @Req() request: AuthenticatedRequest,
  ) {
    // Se já é um objectKey completo (contém "/"), usa direto
    if (filename.includes('/')) {
      return await this.minioClientService.getDocumentByKey(filename);
    }
    const { userId } = request.user;
    return await this.minioClientService.getDocument(userId, filename);
  }
}
