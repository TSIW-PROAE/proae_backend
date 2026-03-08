import { Inject, Injectable } from '@nestjs/common';
import { VALIDACAO_REPOSITORY } from '../validacao.tokens';
import type { IValidacaoRepository } from '../ports/validacao.repository.port';
import type { ValidacaoData } from '../../../domain/validacao';

@Injectable()
export class CreateValidacaoUseCase {
  constructor(
    @Inject(VALIDACAO_REPOSITORY)
    private readonly validacaoRepository: IValidacaoRepository,
  ) {}

  async execute(cmd: Omit<ValidacaoData, 'id'>) {
    return this.validacaoRepository.create(cmd);
  }
}

