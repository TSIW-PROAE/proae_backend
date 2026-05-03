import { Inject, Injectable } from '@nestjs/common';
import type { IRespostaRepository } from '../ports/resposta.repository.port';
import { RESPOSTA_REPOSITORY } from '../resposta.tokens';
import type { RespostaData } from '../../../domain/resposta/resposta.types';

export interface UpdateRespostaCommand {
  valorTexto?: string | null;
  valorOpcoes?: string[] | null;
  urlArquivo?: string | null;
  texto?: string | null;
}

@Injectable()
export class UpdateRespostaUseCase {
  constructor(
    @Inject(RESPOSTA_REPOSITORY)
    private readonly respostaRepository: IRespostaRepository,
  ) {}

  async execute(id: number, cmd: UpdateRespostaCommand): Promise<RespostaData> {
    return this.respostaRepository.update(id, cmd);
  }
}

