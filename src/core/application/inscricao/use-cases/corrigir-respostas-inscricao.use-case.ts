import { Inject, Injectable } from '@nestjs/common';
import type { IInscricaoRepository } from '../ports/inscricao.repository.port';
import type { CorrigirRespostasInscricaoCommand } from '../../../domain/inscricao/inscricao.types';
import { INSCRICAO_REPOSITORY } from '../inscricao.tokens';

@Injectable()
export class CorrigirRespostasInscricaoUseCase {
  constructor(
    @Inject(INSCRICAO_REPOSITORY)
    private readonly inscricaoRepository: IInscricaoRepository,
  ) {}

  execute(
    inscricaoId: number,
    cmd: CorrigirRespostasInscricaoCommand,
    userId: string,
  ) {
    return this.inscricaoRepository.corrigirRespostasPendentes(
      inscricaoId,
      cmd,
      userId,
    );
  }
}
