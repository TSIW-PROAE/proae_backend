import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pergunta } from '../entities/edital/pergunta.entity';
import { Step } from '../entities/edital/step.entity';
import { PerguntaController } from './pergunta.controller';
import { PerguntaService } from './pergunta.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pergunta, Step]),
  ],
  controllers: [PerguntaController],
  providers: [PerguntaService],
  exports: [PerguntaService],
})
export class PerguntaModule {}
