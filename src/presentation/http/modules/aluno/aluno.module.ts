import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ALUNO_REPOSITORY } from 'src/core/application/aluno/aluno.tokens';
import { FindAlunoByUserIdUseCase } from 'src/core/application/aluno/use-cases/find-aluno-by-user-id.use-case';
import { HasReprovadoDocumentsUseCase } from 'src/core/application/aluno/use-cases/has-reprovado-documents.use-case';
import { ListAlunosUseCase } from 'src/core/application/aluno/use-cases/list-alunos.use-case';
import { UpdateAlunoDataUseCase } from 'src/core/application/aluno/use-cases/update-aluno-data.use-case';
import { Aluno } from 'src/infrastructure/persistence/typeorm/entities/aluno/aluno.entity';
import { Edital } from 'src/infrastructure/persistence/typeorm/entities/edital/edital.entity';
import { Inscricao } from 'src/infrastructure/persistence/typeorm/entities/inscricao/inscricao.entity';
import { Step } from 'src/infrastructure/persistence/typeorm/entities/step/step.entity';
import { Usuario } from 'src/infrastructure/persistence/typeorm/entities/usuarios/usuario.entity';
import { Vagas } from 'src/infrastructure/persistence/typeorm/entities/vagas/vagas.entity';
import { AlunoTypeOrmRepository } from 'src/infrastructure/persistence/typeorm/repositories/aluno.typeorm.repository';
import { AuthModule } from 'src/presentation/http/modules/auth/auth.module';
import { BeneficiosController } from './beneficios.controller';
import { AlunoController } from './aluno.controller';
import { AlunoService } from './aluno.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Aluno, Inscricao, Usuario, Step, Edital, Vagas]),
    forwardRef(() => AuthModule),
  ],
  controllers: [AlunoController, BeneficiosController],
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
