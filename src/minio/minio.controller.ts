import {
  Controller,
  Post,
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
  uploadFiles(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: /png|jpeg|pdf/ })],
      }),
    )
    files: Express.Multer.File[],
  ) {
    return this.minioClientService.uploadFiles(files);
  }
}

//   @Get('download/:bucket/:filename')
//   async downloadFile(
//     @Param('bucket') bucket: string,
//     @Param('filename') filename: string,
//   ) {
//     return await this.minioClientService.download_file(filename, bucket);
//   }
// }
