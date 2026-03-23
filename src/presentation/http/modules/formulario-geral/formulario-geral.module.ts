import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Edital } from 'src/infrastructure/persistence/typeorm/entities/edital/edital.entity';
import { Vagas } from 'src/infrastructure/persistence/typeorm/entities/vagas/vagas.entity';
import { Inscricao } from 'src/infrastructure/persistence/typeorm/entities/inscricao/inscricao.entity';
import { Aluno } from 'src/infrastructure/persistence/typeorm/entities/aluno/aluno.entity';
import { Step } from 'src/infrastructure/persistence/typeorm/entities/step/step.entity';
import { Pergunta } from 'src/infrastructure/persistence/typeorm/entities/pergunta/pergunta.entity';
import { FormularioGeralController } from './formulario-geral.controller';
import { FormularioGeralService } from './formulario-geral.service';
import { InscricaoAuditModule } from '../inscricao-audit/inscricao-audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Edital, Vagas, Inscricao, Aluno, Step, Pergunta]),
    InscricaoAuditModule,
  ],
  controllers: [FormularioGeralController],
  providers: [FormularioGeralService],
  exports: [FormularioGeralService],
})
export class FormularioGeralModule {}
