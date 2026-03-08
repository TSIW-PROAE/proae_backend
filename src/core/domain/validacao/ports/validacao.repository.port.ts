import type { StatusValidacao } from '../../../shared-kernel/enums/statusValidacao';
import type { ValidacaoData } from '../validacao.types';

export interface IValidacaoRepository {
  create(data: Omit<ValidacaoData, 'id'>): Promise<ValidacaoData>;
  findAll(): Promise<ValidacaoData[]>;
  findOne(id: number): Promise<ValidacaoData | null>;
  update(id: number, data: Partial<Omit<ValidacaoData, 'id'>>): Promise<ValidacaoData>;
  remove(id: number): Promise<void>;
  aprovar(id: number): Promise<ValidacaoData>;
  reprovar(id: number): Promise<ValidacaoData>;
  findByStatus(status: StatusValidacao): Promise<ValidacaoData[]>;
}

