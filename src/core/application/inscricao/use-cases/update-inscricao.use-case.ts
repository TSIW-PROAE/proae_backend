import { Inject, Injectable } from '@nestjs/common';
import type { IInscricaoRepository } from '../ports/inscricao.repository.port';
import type { UpdateInscricaoCommand } from '../../../domain/inscricao';
import { INSCRICAO_REPOSITORY } from '../inscricao.tokens';

@Injectable()
export class UpdateInscricaoUseCase {
  constructor(
    @Inject(INSCRICAO_REPOSITORY)
    private readonly inscricaoRepository: IInscricaoRepository,
  ) {}

  async execute(inscricaoId: number, cmd: UpdateInscricaoCommand, userId: string) {
    return this.inscricaoRepository.update(inscricaoId, cmd, userId);
  }
}
