import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ValorDadoService } from './valorDado.service';
import { ValorDadoController } from './valorDado.controller';
import { ValorDado } from '../entities/valorDado/valorDado.entity';
import { Dado } from '../entities/tipoDado/tipoDado.entity';
import { Aluno } from '../entities/aluno/aluno.entity';
import { VALOR_DADO_REPOSITORY } from '../core/application/valor-dado';
import { ValorDadoTypeOrmRepository } from '../infrastructure/persistence/typeorm/repositories/valor-dado.typeorm.repository';
import {
  CreateValorDadoUseCase,
  FindValoresByAlunoUseCase,
  UpdateValorDadoUseCase,
  RemoveValorDadoUseCase,
} from '../core/application/valor-dado';

@Module({
  imports: [TypeOrmModule.forFeature([ValorDado, Dado, Aluno])],
  providers: [
    { provide: VALOR_DADO_REPOSITORY, useClass: ValorDadoTypeOrmRepository },
    CreateValorDadoUseCase,
    FindValoresByAlunoUseCase,
    UpdateValorDadoUseCase,
    RemoveValorDadoUseCase,
    ValorDadoService,
  ],
  controllers: [ValorDadoController],
  exports: [ValorDadoService],
})
export class ValorDadoModule {}
