import type { EnumInputFormat } from '../../shared-kernel/enums/enumInputFormat';
import type { EnumTipoInput } from '../../shared-kernel/enums/enumTipoInput';

/**
 * Tipos de domínio para Pergunta.
 * Não depende de TypeORM, Nest ou outras libs de infraestrutura.
 */
export interface PerguntaData {
  id: number;
  stepId: number;
  tipoPergunta: EnumTipoInput;
  texto: string;
  obrigatoria: boolean;
  opcoes?: string[] | null;
  tipoFormatacao?: EnumInputFormat | null;
  dadoId?: number | null;
}

