import type { EnumInputFormat } from '../../shared-kernel/enums/enumInputFormat';
import type { EnumTipoInput } from '../../shared-kernel/enums/enumTipoInput';

export interface StepData {
  id: number;
  editalId: number;
  texto: string;
  ordem?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface PerguntaCondicaoPayload {
  pergunta_id_origem: number;
  operador: 'equals' | 'notEquals' | 'includes' | 'notIncludes';
  valor: string | string[];
}

export interface StepPerguntaData {
  id: number;
  pergunta: string;
  tipo_Pergunta: EnumTipoInput;
  obrigatoriedade: boolean;
  opcoes?: string[];
  tipo_formatacao?: EnumInputFormat;
  ordem?: number;
  condicao?: PerguntaCondicaoPayload | null;
}

export interface StepWithPerguntasData extends StepData {
  perguntas: StepPerguntaData[];
}

