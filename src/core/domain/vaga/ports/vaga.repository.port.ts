import type { VagaData } from '../vaga.types';

export interface IVagaRepository {
  create(data: Omit<VagaData, 'id'>): Promise<VagaData>;
  findByEdital(editalId: number): Promise<VagaData[]>;
  findById(id: number): Promise<VagaData | null>;
  update(id: number, data: Partial<Omit<VagaData, 'id' | 'edital_id'>>): Promise<VagaData>;
  remove(id: number): Promise<void>;
}

