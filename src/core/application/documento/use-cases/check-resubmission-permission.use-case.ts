import { Inject, Injectable } from '@nestjs/common';
import type { IDocumentoRepository } from '../ports/documento.repository.port';
import { DOCUMENTO_REPOSITORY } from '../documento.tokens';
import type { DocumentoData } from '../../../domain/documento';

export interface CheckResubmissionPermissionResult {
  canResubmit: boolean;
  reprovadoDocuments: DocumentoData[];
  message: string;
}

@Injectable()
export class CheckResubmissionPermissionUseCase {
  constructor(
    @Inject(DOCUMENTO_REPOSITORY)
    private readonly documentoRepository: IDocumentoRepository,
  ) {}

  async execute(userId: string): Promise<CheckResubmissionPermissionResult> {
    const reprovadoDocuments =
      await this.documentoRepository.getReprovadoDocumentsByStudent(userId);

    const canResubmit = reprovadoDocuments.length > 0;

    return {
      canResubmit,
      reprovadoDocuments,
      message: canResubmit
        ? 'Você pode editar seus documentos e dados para reenvio'
        : 'Você não possui documentos reprovados. Edição não permitida.',
    };
  }
}

