import { Inject, Injectable } from '@nestjs/common';
import { VALIDACAO_REPOSITORY } from '../validacao.tokens';
import type { IValidacaoRepository } from '../ports/validacao.repository.port';

@Injectable()
export class RemoveValidacaoUseCase {
  constructor(
    @Inject(VALIDACAO_REPOSITORY)
    private readonly validacaoRepository: IValidacaoRepository,
  ) {}

  async execute(id: number): Promise<void> {
    await this.validacaoRepository.remove(id);
  }
}

