import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PERGUNTA_REPOSITORY } from 'src/core/application/pergunta/pergunta.tokens';
import { CreatePerguntaUseCase } from 'src/core/application/pergunta/use-cases/create-pergunta.use-case';
import { FindPerguntasByStepUseCase } from 'src/core/application/pergunta/use-cases/find-perguntas-by-step.use-case';
import { RemovePerguntaUseCase } from 'src/core/application/pergunta/use-cases/remove-pergunta.use-case';
import { UpdatePerguntaUseCase } from 'src/core/application/pergunta/use-cases/update-pergunta.use-case';
import { Pergunta } from 'src/infrastructure/persistence/typeorm/entities/pergunta/pergunta.entity';
import { Step } from 'src/infrastructure/persistence/typeorm/entities/step/step.entity';
import { Dado } from 'src/infrastructure/persistence/typeorm/entities/tipoDado/tipoDado.entity';
import { PerguntaTypeOrmRepository } from 'src/infrastructure/persistence/typeorm/repositories/pergunta.typeorm.repository';
import { PerguntaController } from './pergunta.controller';
import { PerguntaService } from './pergunta.service';

@Module({
  imports: [TypeOrmModule.forFeature([Pergunta, Step, Dado])],
  controllers: [PerguntaController],
  providers: [
    { provide: PERGUNTA_REPOSITORY, useClass: PerguntaTypeOrmRepository },
    FindPerguntasByStepUseCase,
    CreatePerguntaUseCase,
    UpdatePerguntaUseCase,
    RemovePerguntaUseCase,
    PerguntaService,
  ],
  exports: [PerguntaService],
})
export class PerguntaModule {}
