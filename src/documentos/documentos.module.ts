import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Aluno } from 'src/entities/aluno/aluno.entity';
import { Documento } from 'src/entities/documento/documento.entity';
import { Inscricao } from 'src/entities/inscricao/inscricao.entity';
import { DocumentoController } from './documentos.controller';
import { DocumentoService } from './documentos.service';
import { MinioClientModule } from '../minio/minio-client.module';
import { DOCUMENTO_REPOSITORY } from '../core/application/documento';
import { DocumentoTypeOrmRepository } from '../infrastructure/persistence/typeorm/repositories/documento.typeorm.repository';
import {
  GetReprovadoDocumentsByStudentUseCase,
  GetDocumentsWithProblemsByStudentUseCase,
  CheckResubmissionPermissionUseCase,
  CreateDocumentoUseCase,
  FindDocumentosByInscricaoUseCase,
  FindDocumentoByIdUseCase,
  UpdateDocumentoUseCase,
  RemoveDocumentoUseCase,
  FindInscricaoOwnerUserIdUseCase,
  FindDocumentoWithOwnerByIdUseCase,
  HasReprovadoDocumentsByStudentUseCase,
} from '../core/application/documento';

@Module({
  imports: [
    TypeOrmModule.forFeature([Documento, Inscricao, Aluno]),
    forwardRef(() => AuthModule),
    MinioClientModule,
  ],
  controllers: [DocumentoController],
  providers: [
    { provide: DOCUMENTO_REPOSITORY, useClass: DocumentoTypeOrmRepository },
    GetReprovadoDocumentsByStudentUseCase,
    GetDocumentsWithProblemsByStudentUseCase,
    CheckResubmissionPermissionUseCase,
    CreateDocumentoUseCase,
    FindDocumentosByInscricaoUseCase,
    FindDocumentoByIdUseCase,
    UpdateDocumentoUseCase,
    RemoveDocumentoUseCase,
    FindInscricaoOwnerUserIdUseCase,
    FindDocumentoWithOwnerByIdUseCase,
    HasReprovadoDocumentsByStudentUseCase,
    DocumentoService,
  ],
})
export class DocumentoModule {}
