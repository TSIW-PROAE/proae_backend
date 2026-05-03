import { Inject, Injectable } from '@nestjs/common';
import type { IEditalRepository } from '../ports/edital.repository.port';
import { EDITAL_REPOSITORY } from '../edital.tokens';
import { EditalNaoEncontradoError } from './find-edital-by-id.use-case';

@Injectable()
export class GetAlunosInscritosUseCase {
  constructor(
    @Inject(EDITAL_REPOSITORY)
    private readonly editalRepository: IEditalRepository,
  ) {}

  async execute(editalId: number, limit = 20, offset = 0) {
    const exists = await this.editalRepository.findOne(editalId);
    if (!exists) throw new EditalNaoEncontradoError(editalId);
    return this.editalRepository.getAlunosInscritos(editalId, limit, offset);
  }
}
