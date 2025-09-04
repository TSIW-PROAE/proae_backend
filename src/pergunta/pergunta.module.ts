import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Step } from '../entities/step/step.entity';
import { PerguntaController } from './pergunta.controller';
import { PerguntaService } from './pergunta.service';
import { Pergunta } from '../entities/pergunta/pergunta.entity';
import { Dado } from '../entities/tipoDado/tipoDado.entity';
import { Formulario } from '../entities/formulario/formulario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pergunta, Step, Dado, Formulario])],
  controllers: [PerguntaController],
  providers: [PerguntaService],
  exports: [PerguntaService],
})
export class PerguntaModule {}
