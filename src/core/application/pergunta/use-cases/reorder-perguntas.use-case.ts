import { Inject, Injectable } from '@nestjs/common';
import type { IPerguntaRepository } from '../ports/pergunta.repository.port';
import { PERGUNTA_REPOSITORY } from '../pergunta.tokens';

export interface ReorderPerguntasCommand {
  stepId: number;
  updates: { id: number; ordem: number }[];
}

@Injectable()
export class ReorderPerguntasUseCase {
  constructor(
    @Inject(PERGUNTA_REPOSITORY)
    private readonly perguntaRepository: IPerguntaRepository,
  ) {}

  async execute(cmd: ReorderPerguntasCommand): Promise<void> {
    return this.perguntaRepository.reorderByStep(cmd.stepId, cmd.updates);
  }
}
