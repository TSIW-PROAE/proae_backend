import { Inject, Injectable } from '@nestjs/common';
import { DADO_REPOSITORY } from '../dado.tokens';
import type { IDadoRepository } from '../ports/dado.repository.port';
import type { DadoData } from '../../../domain/dado/dado.types';

@Injectable()
export class UpdateDadoUseCase {
  constructor(
    @Inject(DADO_REPOSITORY)
    private readonly dadoRepository: IDadoRepository,
  ) {}

  async execute(id: number, cmd: Partial<Omit<DadoData, 'id'>>) {
    return this.dadoRepository.update(id, cmd);
  }
}

