import { Inject, Injectable } from '@nestjs/common';
import type { IAlunoRepository } from '../ports/aluno.repository.port';
import { ALUNO_REPOSITORY } from '../aluno.tokens';

/**
 * Caso de uso: verificar se o aluno possui documentos reprovados.
 */
@Injectable()
export class HasReprovadoDocumentsUseCase {
  constructor(
    @Inject(ALUNO_REPOSITORY)
    private readonly alunoRepository: IAlunoRepository,
  ) {}

  async execute(userId: string): Promise<boolean> {
    return this.alunoRepository.hasReprovadoDocuments(userId);
  }
}
