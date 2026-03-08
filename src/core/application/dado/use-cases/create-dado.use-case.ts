import { Inject, Injectable } from '@nestjs/common';
import { DADO_REPOSITORY } from '../dado.tokens';
import type { IDadoRepository } from '../ports/dado.repository.port';
import type { DadoData } from '../../../domain/dado';

export type CreateDadoCommand = Omit<DadoData, 'id'>;

@Injectable()
export class CreateDadoUseCase {
  constructor(
    @Inject(DADO_REPOSITORY)
    private readonly dadoRepository: IDadoRepository,
  ) {}

  async execute(cmd: CreateDadoCommand) {
    return this.dadoRepository.create(cmd);
  }
}

