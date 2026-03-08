import type {
  InscricaoComPendenciasItem,
  CreateInscricaoCommand,
  UpdateInscricaoCommand,
  InscricaoData,
} from '../inscricao.types';

export interface IInscricaoRepository {
  getInscricoesComPendenciasByAluno(
    userId: string,
  ): Promise<InscricaoComPendenciasItem[]>;
  create(
    cmd: CreateInscricaoCommand,
    userId: string,
  ): Promise<InscricaoData>;
  update(
    inscricaoId: number,
    cmd: UpdateInscricaoCommand,
    userId: string,
  ): Promise<InscricaoData>;
}
