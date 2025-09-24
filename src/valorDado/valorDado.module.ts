import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ValorDadoService } from './valorDado.service';
import { ValorDadoController } from './valorDado.controller';
import { ValorDado } from '../entities/valorDado/valorDado.entity';
import { Dado } from '../entities/tipoDado/tipoDado.entity';
import { Aluno } from '../entities/aluno/aluno.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ValorDado, Dado, Aluno])],
  providers: [ValorDadoService],
  controllers: [ValorDadoController],
  exports: [ValorDadoService],
})
export class ValorDadoModule {}
