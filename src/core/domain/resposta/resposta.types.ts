/**
 * Tipos de domínio para Resposta.
 */
export interface RespostaData {
  id: number;
  perguntaId: number;
  inscricaoId: number;
  valorTexto?: string | null;
  valorOpcoes?: string[] | null;
  urlArquivo?: string | null;
  texto?: string | null;
  dataResposta: Date;
  validada: boolean;
  dataValidacao?: Date | null;
  dataValidade?: Date | null;
  invalidada?: boolean;
  requerReenvio?: boolean;
  parecer?: string | null;
  prazoReenvio?: Date | null;
  perguntaAdicionadaPosInscricao?: boolean;
  prazoRespostaNovaPergunta?: Date | null;
}

export interface RespostaConsultaResultado {
  sucesso: boolean;
  dados: unknown;
  mensagem?: string;
}

export interface ValidateRespostaCommand {
  validada?: boolean;
  dataValidade?: string;
  invalidada?: boolean;
  requerReenvio?: boolean;
  parecer?: string | null;
  prazoReenvio?: string | null;
}

