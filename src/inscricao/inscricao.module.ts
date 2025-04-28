import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inscricao } from 'src/entities/inscricao/inscricao.entity';
import { Formulario } from 'src/entities/formulario/formulario.entity';
import { Documento } from 'src/entities/documento/documento.entity';
import { InscricaoService } from './inscricao.service';
import { InscricaoController } from './inscricao.controller';
import { Aluno } from 'src/entities/aluno/aluno.entity';
import { Edital } from 'src/entities/edital/edital.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Inscricao, Formulario, Documento, Aluno, Edital]),
  ],
  controllers: [InscricaoController],
  providers: [InscricaoService],
})
export class InscricaoModule {}
