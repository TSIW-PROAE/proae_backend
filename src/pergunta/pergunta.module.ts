import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Step } from '../entities/step/step.entity';
import { PerguntaController } from './pergunta.controller';
import { PerguntaService } from './pergunta.service';
import { Pergunta } from '../entities/pergunta/pergunta.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pergunta, Step])],
  controllers: [PerguntaController],
  providers: [PerguntaService],
  exports: [PerguntaService],
})
export class PerguntaModule {}
