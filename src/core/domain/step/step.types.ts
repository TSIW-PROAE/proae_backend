import type { EnumInputFormat } from '../../shared-kernel/enums/enumInputFormat';
import type { EnumTipoInput } from '../../shared-kernel/enums/enumTipoInput';

export interface StepData {
  id: number;
  editalId: number;
  texto: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface StepPerguntaData {
  id: number;
  pergunta: string;
  tipo_Pergunta: EnumTipoInput;
  obrigatoriedade: boolean;
  opcoes?: string[];
  tipo_formatacao?: EnumInputFormat;
}

export interface StepWithPerguntasData extends StepData {
  perguntas: StepPerguntaData[];
}

