/**
 * Tipos e contratos do agregado Documento (Domain Layer).
 * O domínio não depende de TypeORM, Nest ou infraestrutura.
 */

export type StatusDocumentoDomain =
  | 'NAO_ENVIADO'
  | 'PENDENTE'
  | 'APROVADO'
  | 'REPROVADO'
  | 'EM_ANALISE';

/**
 * Representa os tipos de documento conhecidos pelo domínio.
 * A camada de infraestrutura é responsável por mapear enums de persistência
 * (ex.: EnumTipoDocumento) para estes valores canônicos.
 */
export type TipoDocumentoDomain =
  | 'RG'
  | 'CPF'
  | 'COMPROVANTE_RESIDENCIA'
  | 'HISTORICO_ESCOLAR'
  | 'DIPLOMA'
  | 'OUTRO';

export interface DocumentoValidacaoResumo {
  parecer?: string | null;
  data_validacao?: Date | string | null;
}

export interface DocumentoData {
  id: number;
  inscricao_id: number;
  tipo_documento: TipoDocumentoDomain | string;
  documento_url?: string | null;
  status_documento: StatusDocumentoDomain | string;
  validacoes?: DocumentoValidacaoResumo[];
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateDocumentoData {
  inscricao_id: number;
  tipo_documento: TipoDocumentoDomain;
  documento_url?: string;
  status_documento?: StatusDocumentoDomain;
}

export interface UpdateDocumentoData {
  tipo_documento?: TipoDocumentoDomain | string;
  documento_url?: string;
  status_documento?: StatusDocumentoDomain | string;
}

/**
 * Agrupamento de documentos com problemas por inscrição,
 * usado para o endpoint de "pendências/meus".
 */
export interface DocumentosComProblemasPorInscricao {
  inscricao_id: number;
  vaga_id?: number | null;
  edital_id?: number | null;
  is_formulario_geral?: boolean;
  is_formulario_renovacao?: boolean;
  titulo_edital: string;
  vaga_beneficio?: string | null;
  documentos: DocumentoData[];
  ajustes_resposta?: Array<{
    resposta_id: number;
    pergunta_id?: number | null;
    step_id?: number | null;
    step_texto?: string | null;
    pergunta_texto?: string | null;
    parecer?: string | null;
    prazo_reenvio?: Date | string | null;
    prazo_resposta_nova_pergunta?: Date | string | null;
    tipo_ajuste: 'REENVIO_RESPOSTA' | 'NOVA_PERGUNTA';
  }>;
}

export interface DocumentoOwnerData {
  documento: DocumentoData;
  owner_user_id: string;
}