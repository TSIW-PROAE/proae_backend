import { Inject, Injectable } from '@nestjs/common';
import type { IStepRepository } from '../ports/step.repository.port';
import { STEP_REPOSITORY } from '../step.tokens';

@Injectable()
export class RemoveStepUseCase {
  constructor(
    @Inject(STEP_REPOSITORY)
    private readonly stepRepository: IStepRepository,
  ) {}

  async execute(id: number): Promise<void> {
    await this.stepRepository.remove(id);
  }
}

