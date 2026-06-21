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
  /**
   * Categoria operacional do resultado no edital:
   * - SELECIONADA
   * - CLASSIFICADA
   * - INDEFERIDA
   * - DESISTENTE
   */
  situacao_solicitacao?: string;
  /** Situação de benefício no edital (seleção), separada da análise da inscrição */
  status_beneficio_edital: string;
  /** Publicação de resultado para esta inscrição (não publicado / preliminar / final). */
  resultado_fase?: string;
  /** Situação de recurso administrativo do estudante. */
  recurso_status?: string;
  /** Parecer de recurso (opcional). */
  recurso_observacao?: string | null;
  /** Timestamp ISO da última atualização de publicação de resultado. */
  resultado_publicado_em?: string | null;
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
  /** Soma dos pontos das respostas validadas. */
  pontuacao_validada?: number;
  /** Soma de todos os pesos configurados nas perguntas do edital. */
  pontuacao_maxima?: number;
}

export interface AlunosInscritosPagination {
  pagina: number;
  limite: number;
  total_itens: number;
  total_paginas: number;
  tem_anterior: boolean;
  tem_proxima: boolean;
}

export interface AlunosInscritosListData {
  dados: AlunoInscritoData[];
  paginacao: AlunosInscritosPagination;
}

export interface IEditalRepository {
  create(data: CreateEditalData): Promise<EditalData>;
  /** Opcional: filtra por nível (Graduação / Pós-graduação). */
  findAll(nivelAcademico?: string): Promise<EditalData[]>;
  findOne(id: number): Promise<EditalData | null>;
  update(id: number, data: UpdateEditalData): Promise<EditalData>;
  remove(id: number): Promise<void>;
  /** Editais abertos para inscrição, filtrados por nível quando informado. */
  findOpened(nivelAcademico?: string): Promise<EditalData[]>;
  /**
   * Editais visíveis para o aluno no portal. Inclui ABERTO (inscrição permitida),
   * EM_ANDAMENTO (em fase de análise/seleção) e ENCERRADO (consulta histórica).
   * Filtra pelo nível do estudante.
   */
  findVisiveisParaAluno(nivelAcademico?: string): Promise<EditalData[]>;
  updateStatus(id: number, status: StatusEditalDomain): Promise<EditalData>;
  getAlunosInscritos(
    editalId: number,
    opts: {
      page: number;
      limit: number;
      busca?: string;
      status?: string;
      situacao_solicitacao?: string;
      ordenacao?: string;
    },
  ): Promise<AlunosInscritosListData>;
}
