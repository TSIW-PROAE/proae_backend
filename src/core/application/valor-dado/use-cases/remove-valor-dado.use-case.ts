import { Inject, Injectable } from '@nestjs/common';
import { VALOR_DADO_REPOSITORY } from '../valor-dado.tokens';
import type { IValorDadoRepository } from '../ports/valor-dado.repository.port';

@Injectable()
export class RemoveValorDadoUseCase {
  constructor(
    @Inject(VALOR_DADO_REPOSITORY)
    private readonly valorDadoRepository: IValorDadoRepository,
  ) {}

  async execute(id: number): Promise<void> {
    await this.valorDadoRepository.remove(id);
  }
}

