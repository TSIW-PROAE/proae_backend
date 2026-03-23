import { Inject, Injectable } from '@nestjs/common';
import type { IPerguntaRepository } from '../ports/pergunta.repository.port';
import { PERGUNTA_REPOSITORY } from '../pergunta.tokens';

@Injectable()
export class RemovePerguntaUseCase {
  constructor(
    @Inject(PERGUNTA_REPOSITORY)
    private readonly perguntaRepository: IPerguntaRepository,
  ) {}

  async execute(id: number): Promise<void> {
    await this.perguntaRepository.remove(id);
  }
}

