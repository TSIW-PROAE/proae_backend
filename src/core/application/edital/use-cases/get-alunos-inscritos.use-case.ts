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

  async execute(
    editalId: number,
    opts?: {
      page?: number;
      limit?: number;
      busca?: string;
      status?: string;
      situacao_solicitacao?: string;
      ordenacao?: string;
    },
  ) {
    const exists = await this.editalRepository.findOne(editalId);
    if (!exists) throw new EditalNaoEncontradoError(editalId);
    const page =
      Number.isFinite(opts?.page) && Number(opts?.page) > 0
        ? Math.floor(Number(opts?.page))
        : 1;
    const limit =
      Number.isFinite(opts?.limit) && Number(opts?.limit) > 0
        ? Math.min(Math.floor(Number(opts?.limit)), 100)
        : 20;

    return this.editalRepository.getAlunosInscritos(editalId, {
      page,
      limit,
      busca: opts?.busca,
      status: opts?.status,
      situacao_solicitacao: opts?.situacao_solicitacao,
      ordenacao: opts?.ordenacao,
    });
  }
}
