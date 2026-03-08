import type {
  EditalData,
  CreateEditalData,
  UpdateEditalData,
  StatusEditalDomain,
} from '../edital.types';

/** Aluno resumido para listagem de inscritos (evita acoplamento com entidade Aluno) */
export interface AlunoInscritoData {
  aluno_id: number;
  matricula: string;
  curso: string;
  campus: string;
  data_ingresso: string;
  usuario: {
    usuario_id: string;
    email: string;
    nome: string;
    cpf: string;
    celular: string;
    data_nascimento: Date;
    roles: string[];
  };
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
