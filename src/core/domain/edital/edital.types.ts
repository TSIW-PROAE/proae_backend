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
  /** Opcional: classificação semântica da etapa (ex.: INSCRICAO, RECURSO). */
  tipo_etapa?: string;
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
  /** Janela de inscrição aberta/fechada, independente do status do edital. */
  inscricoes_abertas?: boolean;
  /** Janela de ajuste de pendências aberta/fechada. */
  ajustes_abertos?: boolean;
  /** Quando true, representa o processo anual de renovação de benefícios. */
  is_formulario_renovacao?: boolean;
  /** Chamada de Cadastro Geral (comprovação socioeconômica). */
  is_cadastro_geral?: boolean;
  etapa_edital?: EtapaEditalItem[];
  /** Graduação | Pós-graduação */
  nivel_academico: string;
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
  /** Quando true, aplica template padrão de perguntas com pesos. */
  aplicar_template_cadastro?: boolean;
  /** Quando true, cria o edital como formulário de renovação. */
  is_formulario_renovacao?: boolean;
  /** Quando true, cria chamada de Cadastro Geral (CG). */
  is_cadastro_geral?: boolean;
  /** Controle manual da janela de inscrição do edital. */
  inscricoes_abertas?: boolean;
  /** Controle manual da janela de ajustes/correções do edital. */
  ajustes_abertos?: boolean;
}

export interface UpdateEditalData {
  titulo_edital?: string;
  descricao?: string;
  edital_url?: EditalUrlItem[];
  etapa_edital?: EtapaEditalItem[];
  nivel_academico?: string;
  /** Permite marcar/desmarcar o edital como renovação. */
  is_formulario_renovacao?: boolean;
  /** Permite marcar/desmarcar chamada de Cadastro Geral. */
  is_cadastro_geral?: boolean;
  /** Permite abrir/fechar inscrições sem alterar status do edital. */
  inscricoes_abertas?: boolean;
  /** Permite abrir/fechar ajustes de pendências sem alterar status do edital. */
  ajustes_abertos?: boolean;
  /**
   * Data fim de vigência do edital no portal do aluno.
   * - `undefined`  → não altera o valor atual.
   * - `null`       → limpa (remove a data fim).
   * - `Date|string` → atualiza para a nova data (`YYYY-MM-DD`).
   */
  data_fim_vigencia?: Date | string | null;
}
