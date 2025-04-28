import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFiles,
  ParseFilePipe,
  FileTypeValidator,
} from '@nestjs/common';
import { MinioClientService } from './minio.service';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('files')
export class MinioClientController {
  constructor(private readonly minioClientService: MinioClientService) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFiles(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: /png|jpeg|pdf/ })],
      }),
    )
    files: Express.Multer.File[],
  ) {
    return this.minioClientService.uploadFiles(files);
  }

  @Get(':filename')
  async getFile(@Param('filename') filename: string) {
    return await this.minioClientService.getFile(filename);
  }
}
