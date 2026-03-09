import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DOCUMENTO_REPOSITORY } from 'src/core/application/documento/documento.tokens';
import { CheckResubmissionPermissionUseCase } from 'src/core/application/documento/use-cases/check-resubmission-permission.use-case';
import { CreateDocumentoUseCase } from 'src/core/application/documento/use-cases/create-documento.use-case';
import { FindDocumentoByIdUseCase } from 'src/core/application/documento/use-cases/find-documento-by-id.use-case';
import { FindDocumentoWithOwnerByIdUseCase } from 'src/core/application/documento/use-cases/find-documento-with-owner-by-id.use-case';
import { FindDocumentosByInscricaoUseCase } from 'src/core/application/documento/use-cases/find-documentos-by-inscricao.use-case';
import { FindInscricaoOwnerUserIdUseCase } from 'src/core/application/documento/use-cases/find-inscricao-owner-user-id.use-case';
import { GetDocumentsWithProblemsByStudentUseCase } from 'src/core/application/documento/use-cases/get-documents-with-problems-by-student.use-case';
import { GetReprovadoDocumentsByStudentUseCase } from 'src/core/application/documento/use-cases/get-reprovado-documents-by-student.use-case';
import { HasReprovadoDocumentsByStudentUseCase } from 'src/core/application/documento/use-cases/has-reprovado-documents-by-student.use-case';
import { RemoveDocumentoUseCase } from 'src/core/application/documento/use-cases/remove-documento.use-case';
import { UpdateDocumentoUseCase } from 'src/core/application/documento/use-cases/update-documento.use-case';
import { Aluno } from 'src/infrastructure/persistence/typeorm/entities/aluno/aluno.entity';
import { Documento } from 'src/infrastructure/persistence/typeorm/entities/documento/documento.entity';
import { Inscricao } from 'src/infrastructure/persistence/typeorm/entities/inscricao/inscricao.entity';
import { MinioClientModule } from 'src/infrastructure/adapters/storage/minio/minio-client.module';
import { DocumentoTypeOrmRepository } from 'src/infrastructure/persistence/typeorm/repositories/documento.typeorm.repository';
import { AuthModule } from 'src/presentation/http/modules/auth/auth.module';
import { DocumentoController } from './documentos.controller';
import { DocumentoService } from './documentos.service';

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
