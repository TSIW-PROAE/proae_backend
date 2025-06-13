import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Aluno } from '../entities/aluno/aluno.entity';
import { Beneficio } from '../entities/beneficio/beneficio.entity';
import { Inscricao } from '../entities/inscricao/inscricao.entity';
import { AlunoController } from './aluno.controller';
import { AlunoService } from './aluno.service';

@Module({
  imports: [TypeOrmModule.forFeature([Aluno, Inscricao, Beneficio])],
  controllers: [AlunoController],
  providers: [AlunoService],
  exports: [TypeOrmModule],
})
export class AlunoModule {}
