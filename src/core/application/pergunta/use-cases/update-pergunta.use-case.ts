import { Inject, Injectable } from '@nestjs/common';
import type { IPerguntaRepository } from '../ports/pergunta.repository.port';
import { PERGUNTA_REPOSITORY } from '../pergunta.tokens';
import type { PerguntaData } from '../../../domain/pergunta';
import type { EnumInputFormat } from '../../../shared-kernel/enums/enumInputFormat';

export interface UpdatePerguntaCommand {
  texto?: string;
  obrigatoria?: boolean;
  opcoes?: string[] | null;
  tipoFormatacao?: EnumInputFormat | null;
  dadoId?: number | null;
}

@Injectable()
export class UpdatePerguntaUseCase {
  constructor(
    @Inject(PERGUNTA_REPOSITORY)
    private readonly perguntaRepository: IPerguntaRepository,
  ) {}

  async execute(
    id: number,
    cmd: UpdatePerguntaCommand,
  ): Promise<PerguntaData> {
    return this.perguntaRepository.update(id, cmd);
  }
}

