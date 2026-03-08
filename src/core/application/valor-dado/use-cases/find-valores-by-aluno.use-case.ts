import { Inject, Injectable } from '@nestjs/common';
import { VALOR_DADO_REPOSITORY } from '../valor-dado.tokens';
import type { IValorDadoRepository } from '../ports/valor-dado.repository.port';

@Injectable()
export class FindValoresByAlunoUseCase {
  constructor(
    @Inject(VALOR_DADO_REPOSITORY)
    private readonly valorDadoRepository: IValorDadoRepository,
  ) {}

  async execute(alunoId: number) {
    return this.valorDadoRepository.findByAlunoId(alunoId);
  }
}

