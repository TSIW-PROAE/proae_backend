import { Inject, Injectable } from '@nestjs/common';
import { RESPOSTA_REPOSITORY } from '../resposta.tokens';
import type { IRespostaRepository } from '../ports/resposta.repository.port';

@Injectable()
export class FindRespostasPerguntaEditalUseCase {
  constructor(
    @Inject(RESPOSTA_REPOSITORY)
    private readonly respostaRepository: IRespostaRepository,
  ) {}

  async execute(perguntaId: number, editalId: number) {
    return this.respostaRepository.findRespostasPerguntaEdital(
      perguntaId,
      editalId,
    );
  }
}

