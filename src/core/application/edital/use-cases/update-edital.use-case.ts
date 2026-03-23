import { Inject, Injectable } from '@nestjs/common';
import type { IEditalRepository } from '../ports/edital.repository.port';
import type { UpdateEditalData } from '../../../domain/edital/edital.types';
import { EDITAL_REPOSITORY } from '../edital.tokens';
import { EditalNaoEncontradoError } from './find-edital-by-id.use-case';

@Injectable()
export class UpdateEditalUseCase {
  constructor(
    @Inject(EDITAL_REPOSITORY)
    private readonly editalRepository: IEditalRepository,
  ) {}

  async execute(id: number, data: UpdateEditalData) {
    const exists = await this.editalRepository.findOne(id);
    if (!exists) throw new EditalNaoEncontradoError(id);
    const edital = await this.editalRepository.update(id, data);
    return {
      id: edital.id,
      titulo_edital: edital.titulo_edital,
      descricao: edital.descricao,
      edital_url: edital.edital_url,
      status_edital: edital.status_edital,
      etapa_edital: edital.etapa_edital,
      nivel_academico: edital.nivel_academico,
      created_at: edital.created_at,
      updated_at: edital.updated_at,
    };
  }
}
