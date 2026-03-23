import type { DadoData } from '../dado.types';

export interface IDadoRepository {
  create(data: Omit<DadoData, 'id'>): Promise<DadoData>;
  findAll(): Promise<DadoData[]>;
  findOne(id: number): Promise<DadoData | null>;
  update(id: number, data: Partial<Omit<DadoData, 'id'>>): Promise<DadoData>;
  remove(id: number): Promise<void>;
}

