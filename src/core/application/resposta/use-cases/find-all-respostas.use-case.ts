import { Inject, Injectable } from '@nestjs/common';
import type { IRespostaRepository } from '../ports/resposta.repository.port';
import { RESPOSTA_REPOSITORY } from '../resposta.tokens';
import type { RespostaData } from '../../../domain/resposta';

@Injectable()
export class FindAllRespostasUseCase {
  constructor(
    @Inject(RESPOSTA_REPOSITORY)
    private readonly respostaRepository: IRespostaRepository,
  ) {}

  async execute(): Promise<RespostaData[]> {
    return this.respostaRepository.findAll();
  }
}

