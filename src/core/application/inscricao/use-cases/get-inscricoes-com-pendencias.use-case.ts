import { Inject, Injectable } from '@nestjs/common';
import type { IInscricaoRepository } from '../ports/inscricao.repository.port';
import { INSCRICAO_REPOSITORY } from '../inscricao.tokens';

@Injectable()
export class GetInscricoesComPendenciasUseCase {
  constructor(
    @Inject(INSCRICAO_REPOSITORY)
    private readonly inscricaoRepository: IInscricaoRepository,
  ) {}

  async execute(userId: string) {
    return this.inscricaoRepository.getInscricoesComPendenciasByAluno(userId);
  }
}
