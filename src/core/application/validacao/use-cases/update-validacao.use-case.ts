import { Inject, Injectable } from '@nestjs/common';
import { VALIDACAO_REPOSITORY } from '../validacao.tokens';
import type { IValidacaoRepository } from '../ports/validacao.repository.port';
import type { ValidacaoData } from '../../../domain/validacao';

@Injectable()
export class UpdateValidacaoUseCase {
  constructor(
    @Inject(VALIDACAO_REPOSITORY)
    private readonly validacaoRepository: IValidacaoRepository,
  ) {}

  async execute(
    id: number,
    cmd: Partial<Omit<ValidacaoData, 'id'>>,
  ) {
    return this.validacaoRepository.update(id, cmd);
  }
}

