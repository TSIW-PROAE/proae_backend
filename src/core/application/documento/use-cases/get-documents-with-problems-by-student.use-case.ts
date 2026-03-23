import { Inject, Injectable } from '@nestjs/common';
import type { IDocumentoRepository } from '../ports/documento.repository.port';
import { DOCUMENTO_REPOSITORY } from '../documento.tokens';
import type { DocumentosComProblemasPorInscricao } from '../../../domain/documento/documento.types';

/**
 * Caso de uso: buscar documentos com problemas (não aprovados) agrupados por inscrição.
 */
@Injectable()
export class GetDocumentsWithProblemsByStudentUseCase {
  constructor(
    @Inject(DOCUMENTO_REPOSITORY)
    private readonly documentoRepository: IDocumentoRepository,
  ) {}

  async execute(userId: string): Promise<DocumentosComProblemasPorInscricao[]> {
    return this.documentoRepository.getDocumentsWithProblemsByStudent(userId);
  }
}

