import { Inject, Injectable } from '@nestjs/common';
import { RESPOSTA_REPOSITORY } from '../resposta.tokens';
import type { IRespostaRepository } from '../ports/resposta.repository.port';

@Injectable()
export class FindPerguntasComRespostasAlunoStepUseCase {
  constructor(
    @Inject(RESPOSTA_REPOSITORY)
    private readonly respostaRepository: IRespostaRepository,
  ) {}

  async execute(alunoId: number, editalId: number, stepId: number) {
    return this.respostaRepository.findPerguntasComRespostasAlunoStep(
      alunoId,
      editalId,
      stepId,
    );
  }
}

