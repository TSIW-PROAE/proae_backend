import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { FILE_STORAGE } from 'src/core/application/utilities/utility.tokens';
import type { FileStoragePort } from 'src/core/application/utilities/ports/file-storage.port';
import AuthenticatedRequest from 'src/core/shared-kernel/types/authenticated-request.interface';
import { JwtAuthGuard } from 'src/presentation/http/modules/auth/guards/jwt-auth.guard';

const MIME_PERMITIDOS = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/octet-stream',
];
const EXT_PERMITIDAS = /\.(pdf|png|jpe?g)$/i;

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class MinioClientController {
  constructor(
    @Inject(FILE_STORAGE) private readonly storage: FileStoragePort,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'files', maxCount: 10 },
      { name: 'file', maxCount: 1 },
    ]),
  )
  async uploadDocuments(
    @UploadedFiles() uploaded: Record<string, Express.Multer.File[]> | undefined,
    @Req() request: AuthenticatedRequest,
  ) {
    const files = [
      ...(uploaded?.files ?? []),
      ...(uploaded?.file ?? []),
    ].filter(Boolean) as Express.Multer.File[];
    if (!files.length) {
      throw new BadRequestException(
        'Envie pelo menos um arquivo no campo "files" ou "file" (multipart/form-data). Formatos: PDF, PNG, JPEG.',
      );
    }
    for (const f of files) {
      const mimeOk = MIME_PERMITIDOS.includes(f.mimetype);
      const extOk = EXT_PERMITIDAS.test(f.originalname ?? '');
      if (!mimeOk && !extOk) {
        throw new BadRequestException(
          `Formato não permitido: ${f.originalname}. Use PDF, PNG ou JPEG.`,
        );
      }
    }
    const { userId } = request.user;
    return this.storage.uploadDocuments(userId, files);
  }

  @Get(':filename')
  async getDocument(
    @Param('filename') filename: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const { userId } = request.user;
    return await this.storage.getDocument(userId, filename);
  }
}
