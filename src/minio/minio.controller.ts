import {
  Controller,
  FileTypeValidator,
  Get,
  Param,
  ParseFilePipe,
  Post,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import AuthenticatedRequest from '../types/authenticated-request.interface';
import { MinioClientService } from './minio.service';
import { Public } from '../common/decorators/public';

@Controller('documents')
export class MinioClientController {
  constructor(private readonly minioClientService: MinioClientService) {}

  @Public()
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

  @Public()
  @Get(':filename')
  async getDocument(
    @Param('filename') filename: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const { id } = request.user;
    return await this.minioClientService.getDocument(id, filename);
  }
}
