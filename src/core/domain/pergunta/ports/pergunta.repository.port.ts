import type { PerguntaData } from '../pergunta.types';

/**
 * Porta do repositório de Pergunta no domínio.
 */
export interface IPerguntaRepository {
  findByStep(stepId: number): Promise<PerguntaData[]>;
  create(data: Omit<PerguntaData, 'id'>): Promise<PerguntaData>;
  update(id: number, data: Partial<Omit<PerguntaData, 'id' | 'stepId'>>): Promise<PerguntaData>;
  remove(id: number): Promise<void>;
}

