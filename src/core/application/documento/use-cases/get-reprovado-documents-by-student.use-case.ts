import { Inject, Injectable } from '@nestjs/common';
import type { IDocumentoRepository } from '../ports/documento.repository.port';
import { DOCUMENTO_REPOSITORY } from '../documento.tokens';
import type { DocumentoData } from '../../../domain/documento';

/**
 * Caso de uso: buscar todos os documentos reprovados de um aluno.
 */
@Injectable()
export class GetReprovadoDocumentsByStudentUseCase {
  constructor(
    @Inject(DOCUMENTO_REPOSITORY)
    private readonly documentoRepository: IDocumentoRepository,
  ) {}

  async execute(userId: string): Promise<DocumentoData[]> {
    return this.documentoRepository.getReprovadoDocumentsByStudent(userId);
  }
}

