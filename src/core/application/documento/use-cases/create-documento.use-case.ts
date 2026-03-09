import { Inject, Injectable } from '@nestjs/common';
import { DOCUMENTO_REPOSITORY } from '../documento.tokens';
import type { IDocumentoRepository } from '../ports/documento.repository.port';
import type { CreateDocumentoData } from '../../../domain/documento/documento.types';

@Injectable()
export class CreateDocumentoUseCase {
  constructor(
    @Inject(DOCUMENTO_REPOSITORY)
    private readonly documentoRepository: IDocumentoRepository,
  ) {}

  async execute(data: CreateDocumentoData) {
    return this.documentoRepository.create(data);
  }
}

