import { Inject, Injectable } from '@nestjs/common';
import type { IEditalRepository } from '../ports/edital.repository.port';
import { EDITAL_REPOSITORY } from '../edital.tokens';

@Injectable()
export class ListEditaisAbertosUseCase {
  constructor(
    @Inject(EDITAL_REPOSITORY)
    private readonly editalRepository: IEditalRepository,
  ) {}

  async execute(nivelAcademico?: string) {
    const editais = await this.editalRepository.findOpened(nivelAcademico);
    return editais.map((e) => ({
      id: e.id,
      titulo_edital: e.titulo_edital,
      descricao: e.descricao,
      edital_url: e.edital_url,
      status_edital: e.status_edital,
      etapa_edital: e.etapa_edital,
      nivel_academico: e.nivel_academico,
      data_fim_vigencia: e.data_fim_vigencia
        ? new Date(e.data_fim_vigencia as Date).toISOString().slice(0, 10)
        : null,
      created_at: e.created_at,
      updated_at: e.updated_at,
      quantidade_bolsas: e.quantidade_bolsas ?? 0,
      numero_beneficios: e.numero_beneficios ?? 0,
    }));
  }
}
