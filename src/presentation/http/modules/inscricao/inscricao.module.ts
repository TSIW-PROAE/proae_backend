import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { INSCRICAO_REPOSITORY } from 'src/core/application/inscricao/inscricao.tokens';
import { CreateInscricaoUseCase } from 'src/core/application/inscricao/use-cases/create-inscricao.use-case';
import { GetInscricoesComPendenciasUseCase } from 'src/core/application/inscricao/use-cases/get-inscricoes-com-pendencias.use-case';
import { UpdateInscricaoUseCase } from 'src/core/application/inscricao/use-cases/update-inscricao.use-case';
import { Aluno } from 'src/infrastructure/persistence/typeorm/entities/aluno/aluno.entity';
import { Documento } from 'src/infrastructure/persistence/typeorm/entities/documento/documento.entity';
import { Edital } from 'src/infrastructure/persistence/typeorm/entities/edital/edital.entity';
import { Inscricao } from 'src/infrastructure/persistence/typeorm/entities/inscricao/inscricao.entity';
import { Pergunta } from 'src/infrastructure/persistence/typeorm/entities/pergunta/pergunta.entity';
import { Resposta } from 'src/infrastructure/persistence/typeorm/entities/resposta/resposta.entity';
import { Vagas } from 'src/infrastructure/persistence/typeorm/entities/vagas/vagas.entity';
import { PdfModule } from 'src/infrastructure/adapters/pdf/pdf.module';
import { InscricaoTypeOrmRepository } from 'src/infrastructure/persistence/typeorm/repositories/inscricao.typeorm.repository';
import { AuthModule } from 'src/presentation/http/modules/auth/auth.module';
import { InscricaoController } from './inscricao.controller';
import { InscricaoService } from './inscricao.service';

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
