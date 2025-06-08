import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inscricao } from 'src/entities/inscricao/inscricao.entity';
import { Documento } from 'src/entities/documento/documento.entity';
import { InscricaoService } from './inscricao.service';
import { InscricaoController } from './inscricao.controller';
import { Aluno } from 'src/entities/aluno/aluno.entity';
import { Edital } from 'src/entities/edital/edital.entity';
import { Resposta } from 'src/entities/inscricao/resposta.entity';
import { Pergunta } from 'src/entities/edital/pergunta.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Inscricao, Documento, Aluno, Edital, Resposta, Pergunta]),
  ],
  controllers: [InscricaoController],
  providers: [InscricaoService],
})
export class InscricaoModule {}
