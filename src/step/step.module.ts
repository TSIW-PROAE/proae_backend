import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Step } from '../entities/edital/step.entity';
import { StepController } from './step.controller';
import { StepService } from './step.service';
import { Pergunta } from '../entities/edital/pergunta.entity';
import { Edital } from '../entities/edital/edital.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Step, Pergunta, Edital])],
  controllers: [StepController],
  providers: [StepService],
  exports: [StepService],
})
export class StepModule {} 