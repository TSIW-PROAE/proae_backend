import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Edital } from '../entities/edital/edital.entity';
import { Pergunta } from '../entities/edital/pergunta.entity';
import { Step } from '../entities/edital/step.entity';
import { StepController } from './step.controller';
import { StepService } from './step.service';

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
