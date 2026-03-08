import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Aluno } from '../entities/aluno/aluno.entity';
import { Documento } from '../entities/documento/documento.entity';
import { Edital } from '../entities/edital/edital.entity';
import { Pergunta } from '../entities/pergunta/pergunta.entity';
import { Inscricao } from '../entities/inscricao/inscricao.entity';
import { Resposta } from '../entities/resposta/resposta.entity';
import { Vagas } from '../entities/vagas/vagas.entity';
import { InscricaoController } from './inscricao.controller';
import { InscricaoService } from './inscricao.service';
import { INSCRICAO_REPOSITORY } from '../core/application/inscricao';
import { InscricaoTypeOrmRepository } from '../infrastructure/persistence/typeorm/repositories/inscricao.typeorm.repository';
import {
  GetInscricoesComPendenciasUseCase,
  CreateInscricaoUseCase,
  UpdateInscricaoUseCase,
} from '../core/application/inscricao';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Inscricao,
      Documento,
      Aluno,
      Edital,
      Resposta,
      Pergunta,
      Vagas,
    ]),
    forwardRef(() => AuthModule),
    PdfModule,
  ],
  controllers: [InscricaoController],
  providers: [
    { provide: INSCRICAO_REPOSITORY, useClass: InscricaoTypeOrmRepository },
    GetInscricoesComPendenciasUseCase,
    CreateInscricaoUseCase,
    UpdateInscricaoUseCase,
    InscricaoService,
  ],
  exports: [InscricaoService],
})
export class InscricaoModule {}
