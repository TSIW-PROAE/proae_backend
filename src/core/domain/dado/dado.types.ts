import type { EnumTipoInput } from '../../shared-kernel/enums/enumTipoInput';

export interface DadoData {
  id: number;
  nome: string;
  tipo: EnumTipoInput;
  obrigatorio: boolean;
  opcoes?: string[];
}

