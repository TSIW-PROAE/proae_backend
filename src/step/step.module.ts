import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Edital } from '../entities/edital/edital.entity';
import { Step } from '../entities/step/step.entity';
import { StepController } from './step.controller';
import { StepService } from './step.service';
import { Pergunta } from '../entities/pergunta/pergunta.entity';
import { STEP_REPOSITORY } from '../core/application/step';
import { StepTypeOrmRepository } from '../infrastructure/persistence/typeorm/repositories/step.typeorm.repository';
import {
  CreateStepUseCase,
  FindStepsByEditalUseCase,
  FindStepsByEditalWithPerguntasUseCase,
  RemoveStepUseCase,
  UpdateStepUseCase,
} from '../core/application/step';

@Module({
  imports: [
    TypeOrmModule.forFeature([Step, Pergunta, Edital]),
    forwardRef(() => AuthModule),
  ],
  controllers: [StepController],
  providers: [
    { provide: STEP_REPOSITORY, useClass: StepTypeOrmRepository },
    CreateStepUseCase,
    FindStepsByEditalUseCase,
    FindStepsByEditalWithPerguntasUseCase,
    UpdateStepUseCase,
    RemoveStepUseCase,
    StepService,
  ],
  exports: [StepService],
})
export class StepModule {}
