import { Inject, Injectable } from '@nestjs/common';
import { DADO_REPOSITORY } from '../dado.tokens';
import type { IDadoRepository } from '../ports/dado.repository.port';

@Injectable()
export class RemoveDadoUseCase {
  constructor(
    @Inject(DADO_REPOSITORY)
    private readonly dadoRepository: IDadoRepository,
  ) {}

  async execute(id: number): Promise<void> {
    await this.dadoRepository.remove(id);
  }
}

