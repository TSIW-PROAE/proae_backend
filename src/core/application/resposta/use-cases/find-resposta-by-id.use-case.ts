import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IRespostaRepository } from '../ports/resposta.repository.port';
import { RESPOSTA_REPOSITORY } from '../resposta.tokens';
import type { RespostaData } from '../../../domain/resposta/resposta.types';

@Injectable()
export class FindRespostaByIdUseCase {
  constructor(
    @Inject(RESPOSTA_REPOSITORY)
    private readonly respostaRepository: IRespostaRepository,
  ) {}

  async execute(id: number): Promise<RespostaData> {
    const resposta = await this.respostaRepository.findOne(id);
    if (!resposta) {
      throw new NotFoundException('Resposta não encontrada');
    }
    return resposta;
  }
}

