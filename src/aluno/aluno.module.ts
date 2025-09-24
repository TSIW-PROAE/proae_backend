import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Aluno } from '../entities/aluno/aluno.entity';
import { Beneficio } from '../entities/beneficio/beneficio.entity';
import { Inscricao } from '../entities/inscricao/inscricao.entity';
import { AlunoController } from './aluno.controller';
import { AlunoService } from './aluno.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Aluno, Inscricao, Beneficio]),
    forwardRef(() => AuthModule),
  ],
  controllers: [AlunoController],
  providers: [AlunoService],
  exports: [TypeOrmModule, AlunoService],
})
export class AlunoModule {}
