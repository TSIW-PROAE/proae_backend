import { Inject, Injectable } from '@nestjs/common';
import type { IStepRepository } from '../ports/step.repository.port';
import { STEP_REPOSITORY } from '../step.tokens';

export interface CreateStepCommand {
  editalId: number;
  texto: string;
}

@Injectable()
export class CreateStepUseCase {
  constructor(
    @Inject(STEP_REPOSITORY)
    private readonly stepRepository: IStepRepository,
  ) {}

  async execute(cmd: CreateStepCommand) {
    return this.stepRepository.create({
      editalId: cmd.editalId,
      texto: cmd.texto,
    });
  }
}

