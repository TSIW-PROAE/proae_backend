import { Inject, Injectable } from '@nestjs/common';
import type { IAlunoRepository } from '../ports/aluno.repository.port';
import type { AtualizaAlunoData } from '../../../domain/aluno/aluno.types';
import { ALUNO_REPOSITORY } from '../aluno.tokens';
import { AlunoNaoEncontradoError } from './find-aluno-by-user-id.use-case';

/**
 * Caso de uso: atualizar dados do aluno.
 */
@Injectable()
export class UpdateAlunoDataUseCase {
  constructor(
    @Inject(ALUNO_REPOSITORY)
    private readonly alunoRepository: IAlunoRepository,
  ) {}

  async execute(userId: string, data: AtualizaAlunoData) {
    const exists = await this.alunoRepository.findByUserId(userId);
    if (!exists) {
      throw new AlunoNaoEncontradoError(userId);
    }
    const updated = await this.alunoRepository.updateByUserId(userId, data);
    return {
      sucesso: true,
      dados: {
        aluno_id: updated.alunoId,
        email: updated.email,
        matricula: updated.matricula,
        data_nascimento: updated.dataNascimento,
        curso: updated.curso,
        campus: updated.campus,
        cpf: updated.cpf,
        data_ingresso: updated.dataIngresso,
        celular: updated.celular,
      },
    };
  }
}
