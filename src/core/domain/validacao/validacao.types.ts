import type { StatusValidacao } from '../../shared-kernel/enums/statusValidacao';

export interface ValidacaoData {
  id: number;
  parecer: string;
  status: StatusValidacao;
  data_validacao?: Date;
  responsavel_id: string;
  questionario_id?: number;
  documento_id?: number;
  responsavel?: {
    usuario_id: string;
    nome: string;
    email: string;
  };
  questionario?: {
    id: number;
    texto: string;
  };
}

