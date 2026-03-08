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
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateEditalData {
  titulo_edital: string;
}

export interface UpdateEditalData {
  titulo_edital?: string;
  descricao?: string;
  edital_url?: EditalUrlItem[];
  etapa_edital?: EtapaEditalItem[];
}
