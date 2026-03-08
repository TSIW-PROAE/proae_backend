import { Inject, Injectable } from '@nestjs/common';
import type { IInscricaoRepository } from '../ports/inscricao.repository.port';
import type { CreateInscricaoCommand } from '../../../domain/inscricao';
import { INSCRICAO_REPOSITORY } from '../inscricao.tokens';

@Injectable()
export class CreateInscricaoUseCase {
  constructor(
    @Inject(INSCRICAO_REPOSITORY)
    private readonly inscricaoRepository: IInscricaoRepository,
  ) {}

  async execute(cmd: CreateInscricaoCommand, userId: string) {
    return this.inscricaoRepository.create(cmd, userId);
  }
}
