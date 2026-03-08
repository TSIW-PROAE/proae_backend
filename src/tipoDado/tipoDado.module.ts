import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dado } from '../entities/tipoDado/tipoDado.entity';
import { ValorDado } from '../entities/valorDado/valorDado.entity';
import { Aluno } from '../entities/aluno/aluno.entity';
import { DadoService } from './tipoDado.service';
import { DadoController } from './tipoDado.controller';
import { DADO_REPOSITORY } from '../core/application/dado';
import { DadoTypeOrmRepository } from '../infrastructure/persistence/typeorm/repositories/dado.typeorm.repository';
import {
  CreateDadoUseCase,
  FindAllDadosUseCase,
  FindDadoByIdUseCase,
  UpdateDadoUseCase,
  RemoveDadoUseCase,
} from '../core/application/dado';

@Module({
  imports: [TypeOrmModule.forFeature([Dado, ValorDado, Aluno])],
  providers: [
    { provide: DADO_REPOSITORY, useClass: DadoTypeOrmRepository },
    CreateDadoUseCase,
    FindAllDadosUseCase,
    FindDadoByIdUseCase,
    UpdateDadoUseCase,
    RemoveDadoUseCase,
    DadoService,
  ],
  controllers: [DadoController],
  exports: [DadoService],
})
export class DadoModule {}
