import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Aluno } from 'src/entities/aluno/aluno.entity';
import { Documento } from 'src/entities/documento/documento.entity';
import { Edital } from 'src/entities/edital/edital.entity';
import { Pergunta } from 'src/entities/edital/pergunta.entity';
import { Inscricao } from 'src/entities/inscricao/inscricao.entity';
import { Resposta } from 'src/entities/inscricao/resposta.entity';
import { InscricaoController } from './inscricao.controller';
import { InscricaoService } from './inscricao.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Inscricao,
      Documento,
      Aluno,
      Edital,
      Resposta,
      Pergunta,
    ]),
    forwardRef(() => AuthModule),
  ],
  controllers: [InscricaoController],
  providers: [InscricaoService],
})
export class InscricaoModule {}
