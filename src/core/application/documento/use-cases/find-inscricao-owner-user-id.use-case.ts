import { Inject, Injectable } from '@nestjs/common';
import { DOCUMENTO_REPOSITORY } from '../documento.tokens';
import type { IDocumentoRepository } from '../ports/documento.repository.port';

@Injectable()
export class FindInscricaoOwnerUserIdUseCase {
  constructor(
    @Inject(DOCUMENTO_REPOSITORY)
    private readonly documentoRepository: IDocumentoRepository,
  ) {}

  async execute(inscricaoId: number): Promise<string | null> {
    return this.documentoRepository.findInscricaoOwnerUserId(inscricaoId);
  }
}

