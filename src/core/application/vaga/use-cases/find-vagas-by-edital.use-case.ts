import { Inject, Injectable } from '@nestjs/common';
import { VAGA_REPOSITORY } from '../vaga.tokens';
import type { IVagaRepository } from '../ports/vaga.repository.port';

@Injectable()
export class FindVagasByEditalUseCase {
  constructor(
    @Inject(VAGA_REPOSITORY)
    private readonly vagaRepository: IVagaRepository,
  ) {}

  async execute(editalId: number) {
    return this.vagaRepository.findByEdital(editalId);
  }
}

