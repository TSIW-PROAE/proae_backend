import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vagas } from '../entities/vagas/vagas.entity';
import { Edital } from '../entities/edital/edital.entity';
import { VagasController } from './vagas.controller';
import { VagasService } from './vagas.service';
import { VAGA_REPOSITORY } from '../core/application/vaga';
import { VagaTypeOrmRepository } from '../infrastructure/persistence/typeorm/repositories/vaga.typeorm.repository';
import {
  CreateVagaUseCase,
  FindVagasByEditalUseCase,
  UpdateVagaUseCase,
  RemoveVagaUseCase,
} from '../core/application/vaga';

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
