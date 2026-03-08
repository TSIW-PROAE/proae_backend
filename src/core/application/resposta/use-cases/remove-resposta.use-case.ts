import { Inject, Injectable } from '@nestjs/common';
import type { IRespostaRepository } from '../ports/resposta.repository.port';
import { RESPOSTA_REPOSITORY } from '../resposta.tokens';

@Injectable()
export class RemoveRespostaUseCase {
  constructor(
    @Inject(RESPOSTA_REPOSITORY)
    private readonly respostaRepository: IRespostaRepository,
  ) {}

  async execute(id: number): Promise<void> {
    await this.respostaRepository.remove(id);
  }
}

