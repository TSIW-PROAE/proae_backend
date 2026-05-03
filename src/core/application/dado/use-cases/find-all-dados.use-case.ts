import { Inject, Injectable } from '@nestjs/common';
import { DADO_REPOSITORY } from '../dado.tokens';
import type { IDadoRepository } from '../ports/dado.repository.port';

@Injectable()
export class FindAllDadosUseCase {
  constructor(
    @Inject(DADO_REPOSITORY)
    private readonly dadoRepository: IDadoRepository,
  ) {}

  async execute() {
    return this.dadoRepository.findAll();
  }
}

