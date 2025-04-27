import {
  Controller,
  Post,
  UseInterceptors,
  Body,
  Param,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BufferedFile } from './file.model';
import { MinioClientService } from './minio-client.service';

@Controller('files')
export class MinioClientController {
  constructor(private minioClientService: MinioClientService) {}
  @Post('upload')
  @UseInterceptors(FileInterceptor('files'))
  async uploadFiles(
    @Param('bucket') bucket: string,
    @Body() files: { [key: string]: BufferedFile[] },
  ) {
    return await this.minioClientService.upload_files(files, bucket);
  }

  @Get('download/:bucket/:filename')
  async downloadFile(
    @Param('bucket') bucket: string,
    @Param('filename') filename: string,
  ) {
    return await this.minioClientService.download_file(filename, bucket);
  }
}
