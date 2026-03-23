import type { StepData, StepWithPerguntasData } from '../step.types';

export interface IStepRepository {
  findByEditalId(editalId: number): Promise<StepData[]>;
  findByEditalIdWithPerguntas(editalId: number): Promise<StepWithPerguntasData[]>;
  create(data: Omit<StepData, 'id'>): Promise<StepData>;
  update(id: number, data: Partial<Pick<StepData, 'texto'>>): Promise<StepData>;
  remove(id: number): Promise<void>;
}

