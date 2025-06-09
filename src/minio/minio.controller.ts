import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFiles,
  ParseFilePipe,
  FileTypeValidator,
  UseGuards,
  Req,
} from '@nestjs/common';
import { MinioClientService } from './minio.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../auth/auth.guard';
import AuthenticatedRequest from '../types/authenticated-request.interface';

@Controller('documents')
@UseGuards(AuthGuard)
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
    const { id } = request.user;
    return this.minioClientService.uploadDocuments(id, files);
  }

  @Get(':filename')
  async getDocument(
    @Param('filename') filename: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const { id } = request.user;
    return await this.minioClientService.getDocument(id, filename);
  }
}
