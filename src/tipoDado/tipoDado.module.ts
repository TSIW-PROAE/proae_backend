import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dado } from '../entities/tipoDado/tipoDado.entity';
import { ValorDado } from '../entities/valorDado/valorDado.entity';
import { Aluno } from '../entities/aluno/aluno.entity';
import { DadoService } from './tipoDado.service';
import { DadoController } from './tipoDado.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Dado, ValorDado, Aluno])],
  providers: [DadoService],
  controllers: [DadoController],
  exports: [DadoService],
})
export class DadoModule {}
