import { Inject, Injectable } from '@nestjs/common';
import type { IEditalRepository } from '../ports/edital.repository.port';
import { EDITAL_REPOSITORY } from '../edital.tokens';

export class EditalNaoEncontradoError extends Error {
  constructor(id: number) {
    super(`Edital não encontrado: ${id}`);
    this.name = 'EditalNaoEncontradoError';
  }
}

@Injectable()
export class FindEditalByIdUseCase {
  constructor(
    @Inject(EDITAL_REPOSITORY)
    private readonly editalRepository: IEditalRepository,
  ) {}

  async execute(id: number) {
    const edital = await this.editalRepository.findOne(id);
    if (!edital) throw new EditalNaoEncontradoError(id);
    return {
      id: edital.id,
      titulo_edital: edital.titulo_edital,
      descricao: edital.descricao,
      edital_url: edital.edital_url,
      status_edital: edital.status_edital,
      etapa_edital: edital.etapa_edital,
      nivel_academico: edital.nivel_academico,
      is_formulario_geral: edital.is_formulario_geral,
      is_formulario_renovacao: edital.is_formulario_renovacao,
      data_fim_vigencia: edital.data_fim_vigencia,
      created_at: edital.created_at,
      updated_at: edital.updated_at,
    };
  }
}
