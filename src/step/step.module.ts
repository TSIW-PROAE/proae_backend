import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Edital } from '../entities/edital/edital.entity';
import { Step } from '../entities/step/step.entity';
import { StepController } from './step.controller';
import { StepService } from './step.service';
import { Pergunta } from '../entities/pergunta/pergunta.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Step, Pergunta, Edital]),
    forwardRef(() => AuthModule),
  ],
  controllers: [StepController],
  providers: [StepService],
  exports: [StepService],
})
export class StepModule {}
