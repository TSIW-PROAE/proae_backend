import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Edital } from '../entities/edital/edital.entity';
import { EditalController } from './edital.controller';
import { EditalService } from './edital.service';
import { EDITAL_REPOSITORY } from '../core/application/edital';
import { EditalTypeOrmRepository } from '../infrastructure/persistence/typeorm/repositories/edital.typeorm.repository';
import {
  CreateEditalUseCase,
  ListEditaisUseCase,
  FindEditalByIdUseCase,
  UpdateEditalUseCase,
  RemoveEditalUseCase,
  ListEditaisAbertosUseCase,
  UpdateEditalStatusUseCase,
  GetAlunosInscritosUseCase,
} from '../core/application/edital';

@Module({
  imports: [TypeOrmModule.forFeature([Edital]), forwardRef(() => AuthModule)],
  controllers: [EditalController],
  providers: [
    { provide: EDITAL_REPOSITORY, useClass: EditalTypeOrmRepository },
    CreateEditalUseCase,
    ListEditaisUseCase,
    FindEditalByIdUseCase,
    UpdateEditalUseCase,
    RemoveEditalUseCase,
    ListEditaisAbertosUseCase,
    UpdateEditalStatusUseCase,
    GetAlunosInscritosUseCase,
  ],
})
export class EditalModule {}
