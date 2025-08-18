import {
  Controller,
  FileTypeValidator,
  Get,
  Param,
  ParseFilePipe,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
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

  @Get(':filename')
  async getDocument(
    @Param('filename') filename: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const { userId } = request.user;
    return await this.minioClientService.getDocument(userId, filename);
  }
}
