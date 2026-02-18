import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Step } from '../entities/step/step.entity';
import { PerguntaController } from './pergunta.controller';
import { PerguntaService } from './pergunta.service';
import { Pergunta } from '../entities/pergunta/pergunta.entity';
import { Dado } from '../entities/tipoDado/tipoDado.entity';
import { Inscricao } from '../entities/inscricao/inscricao.entity';
import { Resposta } from '../entities/resposta/resposta.entity';
import { Vagas } from '../entities/vagas/vagas.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pergunta, Step, Dado, Inscricao, Resposta, Vagas]),
  ],
  controllers: [PerguntaController],
  providers: [PerguntaService],
  exports: [PerguntaService],
})
export class PerguntaModule {}
