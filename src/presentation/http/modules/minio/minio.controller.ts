import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { FILE_STORAGE } from 'src/core/application/utilities/utility.tokens';
import type { FileStoragePort } from 'src/core/application/utilities/ports/file-storage.port';
import AuthenticatedRequest from 'src/core/shared-kernel/types/authenticated-request.interface';
import { RolesEnum } from 'src/core/shared-kernel/enums/enumRoles';
import { JwtAuthGuard } from 'src/presentation/http/modules/auth/guards/jwt-auth.guard';

const MIME_PERMITIDOS = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/octet-stream',
];
const EXT_PERMITIDAS = /\.(pdf|png|jpe?g)$/i;

function canAccessObjectKey(
  request: AuthenticatedRequest,
  objectKey: string,
): void {
  const { userId, roles } = request.user;
  const isAdmin =
    Array.isArray(roles) &&
    (roles.includes(RolesEnum.ADMIN) || roles.includes('admin'));
  if (isAdmin) {
    return;
  }
  const prefix = `${userId}/`;
  if (!objectKey.startsWith(prefix)) {
    throw new ForbiddenException(
      'Sem permissão para acessar este documento.',
    );
  }
}

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

  /**
   * Proxy: envia o arquivo ao navegador (inline). Admin pode qualquer key;
   * aluno só keys sob o próprio userId.
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
    const decoded = decodeURIComponent(objectKey);
    canAccessObjectKey(request, decoded);
    const { userId } = request.user;
    const { stream, contentType, size } = await this.storage.streamObject(
      decoded,
      userId,
    );
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', size.toString());
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    stream.pipe(res);
  }

  /**
   * URL presigned (24h) pela chave completa no bucket.
   */
  @Get('presigned')
  async getPresignedUrl(
    @Query('key') objectKey: string,
    @Req() request: AuthenticatedRequest,
  ) {
    if (!objectKey) {
      throw new BadRequestException('Parâmetro "key" é obrigatório');
    }
    const decoded = decodeURIComponent(objectKey);
    canAccessObjectKey(request, decoded);
    return this.storage.getDocumentByKey(decoded);
  }

  /**
   * Legado: presigned com filename (sem "/") em userId/documentos/filename.
   * Se o segmento já contém "/", trata como objectKey completo.
   */
  @Get(':filename')
  async getDocument(
    @Param('filename') filename: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const { userId } = request.user;
    const decoded = decodeURIComponent(filename);
    if (decoded.includes('/')) {
      canAccessObjectKey(request, decoded);
      return this.storage.getDocumentByKey(decoded);
    }
    return await this.storage.getDocument(userId, decoded);
  }
}
