import { Inject, Injectable } from '@nestjs/common';
import { DOCUMENTO_REPOSITORY } from '../documento.tokens';
import type { IDocumentoRepository } from '../ports/documento.repository.port';
import type { UpdateDocumentoData } from '../../../domain/documento/documento.types';

@Injectable()
export class UpdateDocumentoUseCase {
  constructor(
    @Inject(DOCUMENTO_REPOSITORY)
    private readonly documentoRepository: IDocumentoRepository,
  ) {}

  async execute(id: number, data: UpdateDocumentoData) {
    return this.documentoRepository.update(id, data);
  }
}

