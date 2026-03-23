/**
 * Tipos do agregado Inscricao (Domain Layer).
 * O domínio não depende de TypeORM, Nest ou infraestrutura.
 */

export interface DocumentoPendenteData {
  tipo_documento: string;
  status_documento: string;
  documento_url: string | null;
  parecer: string | null;
  data_validacao: Date | string | null;
}

export interface InscricaoComPendenciasItem {
  titulo_edital: string;
  tipo_edital: string[];
  documentos: DocumentoPendenteData[];
}

export interface RespostaInscricaoItem {
  perguntaId: number;
  valorTexto?: string;
  valorOpcoes?: unknown;
  urlArquivo?: string;
}

export interface CreateInscricaoCommand {
  vaga_id: number;
  respostas: RespostaInscricaoItem[];
}

/** PATCH /inscricoes/:id/correcao-respostas — aluno envia só as respostas a corrigir. */
export interface CorrigirRespostasInscricaoCommand {
  respostas: RespostaInscricaoItem[];
}

export interface UpdateInscricaoCommand {
  vaga_id?: number;
  respostas?: RespostaInscricaoItem[];
  respostas_editadas?: Array<{
    perguntaId: number;
    valorTexto?: string;
    valorOpcoes?: unknown;
    urlArquivo?: string;
  }>;
  data_inscricao?: Date;
  status_inscricao?: string;
}

export interface InscricaoData {
  aluno_id: number;
  vaga_id: number;
  data_inscricao: Date;
  status_inscricao: string;
  respostas: Array<{ perguntaId: number; valorTexto?: string; valorOpcoes?: unknown; urlArquivo?: string }>;
}
