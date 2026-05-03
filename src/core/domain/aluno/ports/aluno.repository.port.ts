import type { AlunoData, AtualizaAlunoData } from '../aluno.types';

/**
 * Porta (interface) do repositório de Aluno.
 * A implementação vive na camada de infraestrutura; o domínio só depende desta interface.
 */
export interface IAlunoRepository {
  findByUserId(userId: string): Promise<AlunoData | null>;
  findAll(): Promise<AlunoData[]>;
  updateByUserId(userId: string, data: AtualizaAlunoData): Promise<AlunoData>;
  hasReprovadoDocuments(userId: string): Promise<boolean>;
}
