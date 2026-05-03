import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dado } from 'src/infrastructure/persistence/typeorm/entities/tipoDado/tipoDado.entity';
import { ValorDado } from 'src/infrastructure/persistence/typeorm/entities/valorDado/valorDado.entity';
import { Aluno } from 'src/infrastructure/persistence/typeorm/entities/aluno/aluno.entity';
import { DadoService } from './tipoDado.service';
import { DadoController } from './tipoDado.controller';
import { DADO_REPOSITORY } from 'src/core/application/dado/dado.tokens';
import { DadoTypeOrmRepository } from 'src/infrastructure/persistence/typeorm/repositories/dado.typeorm.repository';
import { CreateDadoUseCase } from 'src/core/application/dado/use-cases/create-dado.use-case';
import { FindAllDadosUseCase } from 'src/core/application/dado/use-cases/find-all-dados.use-case';
import { FindDadoByIdUseCase } from 'src/core/application/dado/use-cases/find-dado-by-id.use-case';
import { RemoveDadoUseCase } from 'src/core/application/dado/use-cases/remove-dado.use-case';
import { UpdateDadoUseCase } from 'src/core/application/dado/use-cases/update-dado.use-case';

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
