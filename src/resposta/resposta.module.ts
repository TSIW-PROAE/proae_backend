import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RespostaService } from './resposta.service';
import { RespostaController } from './resposta.controller';
import { Resposta } from '../entities/resposta/resposta.entity';
import { Pergunta } from '../entities/pergunta/pergunta.entity';
import { Inscricao } from '../entities/inscricao/inscricao.entity';
import { MinioClientService } from '../minio/minio.service';

@Module({
  imports: [TypeOrmModule.forFeature([Resposta, Pergunta, Inscricao])],
  providers: [RespostaService, MinioClientService],
  controllers: [RespostaController],
  exports: [RespostaService],
})
export class RespostaModule {}
