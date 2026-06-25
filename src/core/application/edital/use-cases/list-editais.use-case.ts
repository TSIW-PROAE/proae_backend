import { Inject, Injectable } from '@nestjs/common';
import type { IEditalRepository } from '../ports/edital.repository.port';
import { EDITAL_REPOSITORY } from '../edital.tokens';

@Injectable()
export class ListEditaisUseCase {
  constructor(
    @Inject(EDITAL_REPOSITORY)
    private readonly editalRepository: IEditalRepository,
  ) {}

  async execute(nivelAcademico?: string) {
    const editais = await this.editalRepository.findAll(nivelAcademico);
    return editais.map((e) => ({
      id: e.id,
      titulo_edital: e.titulo_edital,
      descricao: e.descricao,
      edital_url: e.edital_url,
      status_edital: e.status_edital,
      inscricoes_abertas: e.inscricoes_abertas ?? false,
      ajustes_abertos: e.ajustes_abertos ?? false,
      is_formulario_renovacao: e.is_formulario_renovacao ?? false,
      is_cadastro_geral: e.is_cadastro_geral ?? false,
      etapa_edital: e.etapa_edital,
      nivel_academico: e.nivel_academico,
      data_fim_vigencia: e.data_fim_vigencia ?? null,
      created_at: e.created_at,
      updated_at: e.updated_at,
    }));
  }
}
