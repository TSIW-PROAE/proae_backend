import { Inject, Injectable } from '@nestjs/common';
import type { IEditalRepository } from '../ports/edital.repository.port';
import type { CreateEditalData } from '../../../domain/edital/edital.types';
import { EDITAL_REPOSITORY } from '../edital.tokens';

@Injectable()
export class CreateEditalUseCase {
  constructor(
    @Inject(EDITAL_REPOSITORY)
    private readonly editalRepository: IEditalRepository,
  ) {}

  async execute(data: CreateEditalData) {
    const edital = await this.editalRepository.create(data);
    return this.toResponse(edital);
  }

  private toResponse(edital: Awaited<ReturnType<IEditalRepository['create']>>) {
    return {
      id: edital.id,
      titulo_edital: edital.titulo_edital,
      descricao: edital.descricao,
      edital_url: edital.edital_url,
      status_edital: edital.status_edital,
      etapa_edital: edital.etapa_edital,
      created_at: edital.created_at,
      updated_at: edital.updated_at,
    };
  }
}
