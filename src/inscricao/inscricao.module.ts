import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Aluno } from 'src/entities/aluno/aluno.entity';
import { Documento } from 'src/entities/documento/documento.entity';
import { Edital } from 'src/entities/edital/edital.entity';
import { Pergunta } from '@/src/entities/pergunta/pergunta.entity';
import { Inscricao } from 'src/entities/inscricao/inscricao.entity';
import { Resposta } from 'src/entities/resposta/resposta.entity';
import { Vagas } from 'src/entities/vagas/vagas.entity';
import { InscricaoController } from './inscricao.controller';
import { InscricaoService } from './inscricao.service';
import { RedisService } from '../redis/redis.service';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Inscricao,
      Documento,
      Aluno,
      Edital,
      Resposta,
      Pergunta,
      Vagas,
    ]),
    forwardRef(() => AuthModule),
    PdfModule,
  ],
  controllers: [InscricaoController],
  providers: [InscricaoService],
  exports: [InscricaoService],
})
export class InscricaoModule {}
