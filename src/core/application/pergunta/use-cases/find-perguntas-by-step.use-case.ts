import { Inject, Injectable } from '@nestjs/common';
import type { IPerguntaRepository } from '../ports/pergunta.repository.port';
import { PERGUNTA_REPOSITORY } from '../pergunta.tokens';
import type { PerguntaData } from '../../../domain/pergunta';

@Injectable()
export class FindPerguntasByStepUseCase {
  constructor(
    @Inject(PERGUNTA_REPOSITORY)
    private readonly perguntaRepository: IPerguntaRepository,
  ) {}

  async execute(stepId: number): Promise<PerguntaData[]> {
    return this.perguntaRepository.findByStep(stepId);
  }
}

