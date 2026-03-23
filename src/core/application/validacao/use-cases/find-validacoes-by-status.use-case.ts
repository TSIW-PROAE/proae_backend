import { Inject, Injectable } from '@nestjs/common';
import type { StatusValidacao } from '../../../shared-kernel/enums/statusValidacao';
import { VALIDACAO_REPOSITORY } from '../validacao.tokens';
import type { IValidacaoRepository } from '../ports/validacao.repository.port';

@Injectable()
export class FindValidacoesByStatusUseCase {
  constructor(
    @Inject(VALIDACAO_REPOSITORY)
    private readonly validacaoRepository: IValidacaoRepository,
  ) {}

  async execute(status: StatusValidacao) {
    return this.validacaoRepository.findByStatus(status);
  }
}

