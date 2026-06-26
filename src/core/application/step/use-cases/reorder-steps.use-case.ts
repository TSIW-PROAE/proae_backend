import { Inject, Injectable } from '@nestjs/common';
import type { IStepRepository } from '../ports/step.repository.port';
import { STEP_REPOSITORY } from '../step.tokens';

export interface ReorderStepsCommand {
  editalId: number;
  updates: { id: number; ordem: number }[];
}

@Injectable()
export class ReorderStepsUseCase {
  constructor(
    @Inject(STEP_REPOSITORY)
    private readonly stepRepository: IStepRepository,
  ) {}

  async execute(cmd: ReorderStepsCommand): Promise<void> {
    return this.stepRepository.reorderByEdital(cmd.editalId, cmd.updates);
  }
}
