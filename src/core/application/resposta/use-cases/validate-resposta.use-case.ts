import { Inject, Injectable } from '@nestjs/common';
import { RESPOSTA_REPOSITORY } from '../resposta.tokens';
import type { IRespostaRepository } from '../ports/resposta.repository.port';
import type { ValidateRespostaCommand } from '../../../domain/resposta';

@Injectable()
export class ValidateRespostaUseCase {
  constructor(
    @Inject(RESPOSTA_REPOSITORY)
    private readonly respostaRepository: IRespostaRepository,
  ) {}

  async execute(respostaId: number, cmd: ValidateRespostaCommand) {
    return this.respostaRepository.validateResposta(respostaId, cmd);
  }
}

