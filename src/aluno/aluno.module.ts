import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlunoService } from './aluno.service';
import { AlunoController } from './aluno.controller';
import { Aluno } from '../entities/aluno/aluno.entity';
import { Inscricao } from '../entities/inscricao/inscricao.entity';
import { Beneficio } from '../entities/beneficio/beneficio.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Aluno, Inscricao, Beneficio])],
  controllers: [AlunoController],
  providers: [AlunoService],
  exports: [TypeOrmModule],
})
export class AlunoModule {}
