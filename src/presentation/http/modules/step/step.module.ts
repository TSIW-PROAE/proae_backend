import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { STEP_REPOSITORY } from 'src/core/application/step/step.tokens';
import { CreateStepUseCase } from 'src/core/application/step/use-cases/create-step.use-case';
import { FindStepsByEditalWithPerguntasUseCase } from 'src/core/application/step/use-cases/find-steps-by-edital-with-perguntas.use-case';
import { FindStepsByEditalUseCase } from 'src/core/application/step/use-cases/find-steps-by-edital.use-case';
import { RemoveStepUseCase } from 'src/core/application/step/use-cases/remove-step.use-case';
import { UpdateStepUseCase } from 'src/core/application/step/use-cases/update-step.use-case';
import { Edital } from 'src/infrastructure/persistence/typeorm/entities/edital/edital.entity';
import { Pergunta } from 'src/infrastructure/persistence/typeorm/entities/pergunta/pergunta.entity';
import { Step } from 'src/infrastructure/persistence/typeorm/entities/step/step.entity';
import { StepTypeOrmRepository } from 'src/infrastructure/persistence/typeorm/repositories/step.typeorm.repository';
import { AuthModule } from 'src/presentation/http/modules/auth/auth.module';
import { StepController } from './step.controller';
import { StepService } from './step.service';

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
