import { Inject, Injectable } from '@nestjs/common';
import type { IEditalRepository } from '../ports/edital.repository.port';
import { EDITAL_REPOSITORY } from '../edital.tokens';
import { EditalNaoEncontradoError } from './find-edital-by-id.use-case';

export class EditalPossuiInscricoesError extends Error {
  constructor() {
    super(
      'Não é possível excluir o edital pois existem inscrições vinculadas às vagas',
    );
    this.name = 'EditalPossuiInscricoesError';
  }
}

@Injectable()
export class RemoveEditalUseCase {
  constructor(
    @Inject(EDITAL_REPOSITORY)
    private readonly editalRepository: IEditalRepository,
  ) {}

  async execute(id: number) {
    await this.editalRepository.remove(id);
    return { message: 'Edital removido com sucesso' };
  }
}
