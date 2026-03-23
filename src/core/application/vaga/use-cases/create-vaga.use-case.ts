import { Inject, Injectable } from '@nestjs/common';
import { VAGA_REPOSITORY } from '../vaga.tokens';
import type { IVagaRepository } from '../ports/vaga.repository.port';
import type { VagaData } from '../../../domain/vaga/vaga.types';

@Injectable()
export class CreateVagaUseCase {
  constructor(
    @Inject(VAGA_REPOSITORY)
    private readonly vagaRepository: IVagaRepository,
  ) {}

  async execute(cmd: Omit<VagaData, 'id'>): Promise<VagaData> {
    return this.vagaRepository.create(cmd);
  }
}

