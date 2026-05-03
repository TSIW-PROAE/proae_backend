import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ValorDadoService } from './valorDado.service';
import { ValorDadoController } from './valorDado.controller';
import { ValorDado } from 'src/infrastructure/persistence/typeorm/entities/valorDado/valorDado.entity';
import { Dado } from 'src/infrastructure/persistence/typeorm/entities/tipoDado/tipoDado.entity';
import { Aluno } from 'src/infrastructure/persistence/typeorm/entities/aluno/aluno.entity';
import { VALOR_DADO_REPOSITORY } from 'src/core/application/valor-dado/valor-dado.tokens';
import { ValorDadoTypeOrmRepository } from 'src/infrastructure/persistence/typeorm/repositories/valor-dado.typeorm.repository';
import { CreateValorDadoUseCase } from 'src/core/application/valor-dado/use-cases/create-valor-dado.use-case';
import { FindValoresByAlunoUseCase } from 'src/core/application/valor-dado/use-cases/find-valores-by-aluno.use-case';
import { RemoveValorDadoUseCase } from 'src/core/application/valor-dado/use-cases/remove-valor-dado.use-case';
import { UpdateValorDadoUseCase } from 'src/core/application/valor-dado/use-cases/update-valor-dado.use-case';

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
