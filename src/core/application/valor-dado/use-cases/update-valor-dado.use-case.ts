import { Inject, Injectable } from '@nestjs/common';
import { VALOR_DADO_REPOSITORY } from '../valor-dado.tokens';
import type { IValorDadoRepository } from '../ports/valor-dado.repository.port';
import type { ValorDadoData } from '../../../domain/valor-dado/valor-dado.types';

@Injectable()
export class UpdateValorDadoUseCase {
  constructor(
    @Inject(VALOR_DADO_REPOSITORY)
    private readonly valorDadoRepository: IValorDadoRepository,
  ) {}

  async execute(
    id: number,
    cmd: Partial<Omit<ValorDadoData, 'id'>>,
  ) {
    return this.valorDadoRepository.update(id, cmd);
  }
}

