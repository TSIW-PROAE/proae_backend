import type {
  EditalData,
  CreateEditalData,
  UpdateEditalData,
  StatusEditalDomain,
} from '../edital.types';

/**
 * Uma linha por inscrição no edital, com dados do aluno e usuário já achatados
 * (o frontend espera nome, email, inscricao_id, etc. no nível raiz).
 */
export interface AlunoInscritoData {
  inscricao_id: number;
  status_inscricao: string;
  /** Situação de benefício no edital (seleção), separada da análise da inscrição */
  status_beneficio_edital: string;
  beneficio_nome: string | null;
  /** ISO ou YYYY-MM-DD */
  data_inscricao: string;
  aluno_id: number;
  usuario_id: string;
  email: string;
  nome: string;
  cpf: string;
  celular: string;
  data_nascimento: string | null;
  matricula: string;
  curso: string;
  campus: string;
  data_ingresso: string;
}

export interface IEditalRepository {
  create(data: CreateEditalData): Promise<EditalData>;
  findAll(): Promise<EditalData[]>;
  findOne(id: number): Promise<EditalData | null>;
  update(id: number, data: UpdateEditalData): Promise<EditalData>;
  remove(id: number): Promise<void>;
  findOpened(): Promise<EditalData[]>;
  updateStatus(id: number, status: StatusEditalDomain): Promise<EditalData>;
  getAlunosInscritos(
    editalId: number,
    limit: number,
    offset: number,
  ): Promise<AlunoInscritoData[]>;
}
