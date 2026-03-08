import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Aluno } from '../entities/aluno/aluno.entity';
import { Inscricao } from '../entities/inscricao/inscricao.entity';
import { Usuario } from '../entities/usuarios/usuario.entity';
import { Step } from '../entities/step/step.entity';
import { Edital } from '../entities/edital/edital.entity';
import { Vagas } from '../entities/vagas/vagas.entity';
import { AlunoController } from './aluno.controller';
import { AlunoService } from './aluno.service';
import { ALUNO_REPOSITORY } from '../core/application/aluno';
import { AlunoTypeOrmRepository } from '../infrastructure/persistence/typeorm/repositories/aluno.typeorm.repository';
import {
  FindAlunoByUserIdUseCase,
  ListAlunosUseCase,
  UpdateAlunoDataUseCase,
  HasReprovadoDocumentsUseCase,
} from '../core/application/aluno';

@Module({
  imports: [
    TypeOrmModule.forFeature([Aluno, Inscricao, Usuario, Step, Edital, Vagas]),
    forwardRef(() => AuthModule),
  ],
  controllers: [AlunoController],
  providers: [
    { provide: ALUNO_REPOSITORY, useClass: AlunoTypeOrmRepository },
    FindAlunoByUserIdUseCase,
    ListAlunosUseCase,
    UpdateAlunoDataUseCase,
    HasReprovadoDocumentsUseCase,
    AlunoService,
  ],
  exports: [TypeOrmModule, AlunoService],
})
export class AlunoModule {}
