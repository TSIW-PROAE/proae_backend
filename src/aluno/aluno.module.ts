import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Aluno } from '../entities/aluno/aluno.entity';
import { Inscricao } from '../entities/inscricao/inscricao.entity';
import { AlunoController } from './aluno.controller';
import { AlunoService } from './aluno.service';
import { Usuario } from '../entities/usuarios/usuario.entity';
import { Step } from '../entities/step/step.entity';
import { Edital } from '../entities/edital/edital.entity';
import { Vagas } from '../entities/vagas/vagas.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Aluno, Inscricao, Usuario, Step, Edital, Vagas]),
    forwardRef(() => AuthModule),
  ],
  controllers: [AlunoController],
  providers: [AlunoService],
  exports: [TypeOrmModule, AlunoService],
})
export class AlunoModule {}
