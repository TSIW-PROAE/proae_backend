import type { ValorDadoData } from '../valor-dado.types';

export interface IValorDadoRepository {
  create(data: Omit<ValorDadoData, 'id'>): Promise<ValorDadoData>;
  findByAlunoId(alunoId: number): Promise<ValorDadoData[]>;
  update(id: number, data: Partial<Omit<ValorDadoData, 'id'>>): Promise<ValorDadoData>;
  remove(id: number): Promise<void>;
}

