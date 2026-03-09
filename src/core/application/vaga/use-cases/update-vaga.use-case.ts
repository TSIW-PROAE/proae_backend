import { Inject, Injectable } from '@nestjs/common';
import { VAGA_REPOSITORY } from '../vaga.tokens';
import type { IVagaRepository } from '../ports/vaga.repository.port';
import type { VagaData } from '../../../domain/vaga/vaga.types';

@Injectable()
export class UpdateVagaUseCase {
  constructor(
    @Inject(VAGA_REPOSITORY)
    private readonly vagaRepository: IVagaRepository,
  ) {}

  async execute(id: number, cmd: Partial<Omit<VagaData, 'id' | 'edital_id'>>) {
    return this.vagaRepository.update(id, cmd);
  }
}

