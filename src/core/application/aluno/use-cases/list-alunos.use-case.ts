import { Inject, Injectable } from '@nestjs/common';
import type { IAlunoRepository } from '../ports/aluno.repository.port';
import { ALUNO_REPOSITORY } from '../aluno.tokens';

export class NenhumAlunoEncontradoError extends Error {
  constructor() {
    super('Alunos não encontrados.');
    this.name = 'NenhumAlunoEncontradoError';
  }
}

/**
 * Caso de uso: listar todos os alunos.
 */
@Injectable()
export class ListAlunosUseCase {
  constructor(
    @Inject(ALUNO_REPOSITORY)
    private readonly alunoRepository: IAlunoRepository,
  ) {}

  async execute() {
    const alunos = await this.alunoRepository.findAll();
    if (!alunos || alunos.length === 0) {
      throw new NenhumAlunoEncontradoError();
    }
    const dados = alunos.map((a) => ({
      aluno_id: a.alunoId,
      nome: a.nome,
      email: a.email,
      matricula: a.matricula,
      data_nascimento: a.dataNascimento,
      curso: a.curso,
      campus: a.campus,
      cpf: a.cpf,
      data_ingresso: a.dataIngresso,
      celular: a.celular,
      inscricoes: a.inscricoes ?? [],
    }));
    return { sucesso: true, dados };
  }
}
