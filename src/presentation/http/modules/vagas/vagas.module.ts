import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vagas } from 'src/infrastructure/persistence/typeorm/entities/vagas/vagas.entity';
import { Edital } from 'src/infrastructure/persistence/typeorm/entities/edital/edital.entity';
import { VagasController } from './vagas.controller';
import { VagasService } from './vagas.service';
import { VAGA_REPOSITORY } from 'src/core/application/vaga/vaga.tokens';
import { VagaTypeOrmRepository } from 'src/infrastructure/persistence/typeorm/repositories/vaga.typeorm.repository';
import { CreateVagaUseCase } from 'src/core/application/vaga/use-cases/create-vaga.use-case';
import { FindVagasByEditalUseCase } from 'src/core/application/vaga/use-cases/find-vagas-by-edital.use-case';
import { RemoveVagaUseCase } from 'src/core/application/vaga/use-cases/remove-vaga.use-case';
import { UpdateVagaUseCase } from 'src/core/application/vaga/use-cases/update-vaga.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([Vagas, Edital])],
  controllers: [VagasController],
  providers: [
    { provide: VAGA_REPOSITORY, useClass: VagaTypeOrmRepository },
    CreateVagaUseCase,
    FindVagasByEditalUseCase,
    UpdateVagaUseCase,
    RemoveVagaUseCase,
    VagasService,
  ],
  exports: [VagasService],
})
export class VagasModule {}
