import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Step } from '../entities/step/step.entity';
import { PerguntaController } from './pergunta.controller';
import { PerguntaService } from './pergunta.service';
import { Pergunta } from '../entities/pergunta/pergunta.entity';
import { Dado } from '../entities/tipoDado/tipoDado.entity';
import { PERGUNTA_REPOSITORY } from '../core/application/pergunta';
import { PerguntaTypeOrmRepository } from '../infrastructure/persistence/typeorm/repositories/pergunta.typeorm.repository';
import {
  FindPerguntasByStepUseCase,
  CreatePerguntaUseCase,
  UpdatePerguntaUseCase,
  RemovePerguntaUseCase,
} from '../core/application/pergunta';

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
