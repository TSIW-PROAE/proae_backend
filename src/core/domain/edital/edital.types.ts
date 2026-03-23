/**
 * Tipos e contratos do agregado Edital (Domain Layer).
 * O domínio não depende de TypeORM, Nest ou infraestrutura.
 */

export type StatusEditalDomain =
  | 'RASCUNHO'
  | 'ABERTO'
  | 'ENCERRADO'
  | 'EM_ANDAMENTO';

export interface EditalUrlItem {
  titulo_documento: string;
  url_documento: string;
}

export interface EtapaEditalItem {
  etapa: string;
  ordem_elemento: number;
  data_inicio: Date;
  data_fim: Date;
}

export interface EditalData {
  id: number;
  titulo_edital: string;
  descricao?: string;
  edital_url?: EditalUrlItem[];
  status_edital: StatusEditalDomain;
  etapa_edital?: EtapaEditalItem[];
  /** Graduação | Pós-graduação */
  nivel_academico: string;
  is_formulario_geral?: boolean;
  is_formulario_renovacao?: boolean;
  data_fim_vigencia?: Date | null;
  created_at?: Date;
  updated_at?: Date;
  /**
   * Soma de `numero_vagas` das vagas do edital (preenchido quando `vagas` são carregadas).
   * Usado no portal do aluno em “Seleções abertas”.
   */
  quantidade_bolsas?: number;
  /** Quantidade de vagas/benefícios cadastrados no edital. */
  numero_beneficios?: number;
}

export interface CreateEditalData {
  titulo_edital: string;
  /** Default Graduação se omitido */
  nivel_academico?: string;
}

export interface UpdateEditalData {
  titulo_edital?: string;
  descricao?: string;
  edital_url?: EditalUrlItem[];
  etapa_edital?: EtapaEditalItem[];
  nivel_academico?: string;
}
