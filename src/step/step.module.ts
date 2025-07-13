import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Edital } from '../entities/edital/edital.entity';
import { Pergunta } from '../entities/edital/pergunta.entity';
import { Step } from '../entities/edital/step.entity';
import { StepController } from './step.controller';
import { StepService } from './step.service';

@Module({
  imports: [TypeOrmModule.forFeature([Step, Pergunta, Edital])],
  controllers: [StepController],
  providers: [StepService],
  exports: [StepService],
})
export class StepModule {} 