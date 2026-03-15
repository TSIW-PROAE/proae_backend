import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RESPOSTA_REPOSITORY } from 'src/core/application/resposta/resposta.tokens';
import { CreateRespostaUseCase } from 'src/core/application/resposta/use-cases/create-resposta.use-case';
import { FindAllRespostasUseCase } from 'src/core/application/resposta/use-cases/find-all-respostas.use-case';
import { FindPerguntasComRespostasAlunoStepUseCase } from 'src/core/application/resposta/use-cases/find-perguntas-com-respostas-aluno-step.use-case';
import { FindRespostaByIdUseCase } from 'src/core/application/resposta/use-cases/find-resposta-by-id.use-case';
import { FindRespostasAlunoEditalUseCase } from 'src/core/application/resposta/use-cases/find-respostas-aluno-edital.use-case';
import { FindRespostasAlunoStepUseCase } from 'src/core/application/resposta/use-cases/find-respostas-aluno-step.use-case';
import { FindRespostasPerguntaEditalUseCase } from 'src/core/application/resposta/use-cases/find-respostas-pergunta-edital.use-case';
import { RemoveRespostaUseCase } from 'src/core/application/resposta/use-cases/remove-resposta.use-case';
import { UpdateRespostaUseCase } from 'src/core/application/resposta/use-cases/update-resposta.use-case';
import { ValidateRespostaUseCase } from 'src/core/application/resposta/use-cases/validate-resposta.use-case';
import { Aluno } from 'src/infrastructure/persistence/typeorm/entities/aluno/aluno.entity';
import { Edital } from 'src/infrastructure/persistence/typeorm/entities/edital/edital.entity';
import { Inscricao } from 'src/infrastructure/persistence/typeorm/entities/inscricao/inscricao.entity';
import { Pergunta } from 'src/infrastructure/persistence/typeorm/entities/pergunta/pergunta.entity';
import { Resposta } from 'src/infrastructure/persistence/typeorm/entities/resposta/resposta.entity';
import { Step } from 'src/infrastructure/persistence/typeorm/entities/step/step.entity';
import { Dado } from 'src/infrastructure/persistence/typeorm/entities/tipoDado/tipoDado.entity';
import { Usuario } from 'src/infrastructure/persistence/typeorm/entities/usuarios/usuario.entity';
import { Vagas } from 'src/infrastructure/persistence/typeorm/entities/vagas/vagas.entity';
import { ValorDado } from 'src/infrastructure/persistence/typeorm/entities/valorDado/valorDado.entity';
import { RespostaTypeOrmRepository } from 'src/infrastructure/persistence/typeorm/repositories/resposta.typeorm.repository';
import { RespostaController } from './resposta.controller';
import { RespostaService } from './resposta.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Resposta,
      Pergunta,
      Inscricao,
      Aluno,
      Usuario,
      Step,
      Edital,
      Vagas,
      ValorDado,
      Dado,
    ]),
  ],
  providers: [
    { provide: RESPOSTA_REPOSITORY, useClass: RespostaTypeOrmRepository },
    CreateRespostaUseCase,
    FindAllRespostasUseCase,
    FindRespostaByIdUseCase,
    UpdateRespostaUseCase,
    RemoveRespostaUseCase,
    FindRespostasAlunoEditalUseCase,
    FindRespostasAlunoStepUseCase,
    FindPerguntasComRespostasAlunoStepUseCase,
    FindRespostasPerguntaEditalUseCase,
    ValidateRespostaUseCase,
    RespostaService,
  ],
  controllers: [RespostaController],
  exports: [RespostaService],
})
export class RespostaModule {}
