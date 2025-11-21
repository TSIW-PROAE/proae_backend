import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RespostaService } from './resposta.service';
import { RespostaController } from './resposta.controller';
import { Resposta } from '../entities/resposta/resposta.entity';
import { Pergunta } from '../entities/pergunta/pergunta.entity';
import { Inscricao } from '../entities/inscricao/inscricao.entity';
import { Aluno } from '../entities/aluno/aluno.entity';
import { Usuario } from '../entities/usuarios/usuario.entity';
import { Step } from '../entities/step/step.entity';
import { Edital } from '../entities/edital/edital.entity';
import { Vagas } from '../entities/vagas/vagas.entity';
import { ValorDado } from '../entities/valorDado/valorDado.entity';
import { Dado } from '../entities/tipoDado/tipoDado.entity';
import { MinioClientService } from '../minio/minio.service';

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
  providers: [RespostaService, MinioClientService],
  controllers: [RespostaController],
  exports: [RespostaService],
})
export class RespostaModule {}
