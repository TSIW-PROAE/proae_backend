import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Aluno } from 'src/entities/aluno/aluno.entity';
import { Documento } from 'src/entities/documento/documento.entity';
import { Inscricao } from 'src/entities/inscricao/inscricao.entity';
import { DocumentoController } from './documentos.controller';
import { DocumentoService } from './documentos.service';
import { MinioClientModule } from '../minio/minio-client.module';
import { MinioClientService } from '../minio/minio.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Documento, Inscricao, Aluno]),
    forwardRef(() => AuthModule),
    MinioClientModule,
  ],
  controllers: [DocumentoController],
  providers: [DocumentoService, MinioClientService],
})
export class DocumentoModule {}
