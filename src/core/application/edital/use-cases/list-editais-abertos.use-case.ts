import { Inject, Injectable } from '@nestjs/common';
import type { IEditalRepository } from '../ports/edital.repository.port';
import { EDITAL_REPOSITORY } from '../edital.tokens';

@Injectable()
export class ListEditaisAbertosUseCase {
  constructor(
    @Inject(EDITAL_REPOSITORY)
    private readonly editalRepository: IEditalRepository,
  ) {}

  async execute() {
    const editais = await this.editalRepository.findOpened();
    return editais.map((e) => ({
      id: e.id,
      titulo_edital: e.titulo_edital,
      descricao: e.descricao,
      edital_url: e.edital_url,
      status_edital: e.status_edital,
      etapa_edital: e.etapa_edital,
      created_at: e.created_at,
      updated_at: e.updated_at,
    }));
  }
}
