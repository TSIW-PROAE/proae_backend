/**
 * Tipos e contratos do agregado Aluno (Domain Layer).
 * O domínio não depende de TypeORM, Nest ou infraestrutura.
 */

/** Campus como value object do domínio */
export type Campus = string;

/** Dados do aluno no domínio (modelo de leitura/escrita) */
export interface AlunoData {
  alunoId: number;
  matricula: string;
  curso: string;
  campus: Campus;
  dataIngresso: string;
  usuarioId: string;
  email: string;
  nome: string;
  cpf: string;
  celular: string;
  dataNascimento: Date;
  inscricoes?: Array<{ id: number; [key: string]: unknown }>;
}

/** Dados para atualização parcial do aluno */
export interface AtualizaAlunoData {
  nome?: string;
  email?: string;
  matricula?: string;
  dataNascimento?: string;
  curso?: string;
  campus?: Campus;
  dataIngresso?: string;
  celular?: string;
  /** CPF com ou sem máscara; persistido mascarado no Usuario */
  cpf?: string;
}
