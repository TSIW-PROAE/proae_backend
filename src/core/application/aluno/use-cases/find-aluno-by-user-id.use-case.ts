import { Inject, Injectable } from '@nestjs/common';
import type { IAlunoRepository } from '../ports/aluno.repository.port';
import { ALUNO_REPOSITORY } from '../aluno.tokens';

export class AlunoNaoEncontradoError extends Error {
  constructor(userId: string) {
    super(`Aluno não encontrado para o usuário: ${userId}`);
    this.name = 'AlunoNaoEncontradoError';
  }
}

/**
 * Caso de uso: buscar aluno pelo ID do usuário autenticado.
 * Depende apenas da porta IAlunoRepository (inversão de dependência).
 */
@Injectable()
export class FindAlunoByUserIdUseCase {
  constructor(
    @Inject(ALUNO_REPOSITORY)
    private readonly alunoRepository: IAlunoRepository,
  ) {}

  async execute(userId: string) {
    const aluno = await this.alunoRepository.findByUserId(userId);
    if (!aluno) {
      throw new AlunoNaoEncontradoError(userId);
    }
    return { sucesso: true, dados: { aluno: this.toResponse(aluno) } };
  }

  private toResponse(aluno: {
    alunoId: number;
    email: string;
    matricula: string;
    dataNascimento: Date;
    curso: string;
    campus: string;
    cpf: string;
    dataIngresso: string;
    celular: string;
    nivelAcademico: string;
    inscricoes?: unknown[];
  }) {
    return {
      aluno_id: aluno.alunoId,
      email: aluno.email,
      matricula: aluno.matricula,
      data_nascimento: aluno.dataNascimento,
      curso: aluno.curso,
      campus: aluno.campus,
      cpf: aluno.cpf,
      data_ingresso: aluno.dataIngresso,
      celular: aluno.celular,
      nivel_academico: aluno.nivelAcademico,
      inscricoes: aluno.inscricoes ?? [],
    };
  }
}
