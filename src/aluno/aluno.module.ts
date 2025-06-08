import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlunoService } from './aluno.service';
import { AlunoController } from './aluno.controller';
import { Aluno } from '../entities/aluno/aluno.entity';
import { Inscricao } from 'src/entities/inscricao/inscricao.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Aluno, Inscricao])],
  controllers: [AlunoController],
  providers: [AlunoService],
  exports: [TypeOrmModule],
})
export class AlunoModule {}
