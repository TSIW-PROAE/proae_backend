import { Inject, Injectable } from '@nestjs/common';
import type { IPerguntaRepository } from '../ports/pergunta.repository.port';
import { PERGUNTA_REPOSITORY } from '../pergunta.tokens';
import type { PerguntaData } from '../../../domain/pergunta/pergunta.types';
import type { EnumInputFormat } from '../../../shared-kernel/enums/enumInputFormat';
import type { EnumTipoInput } from '../../../shared-kernel/enums/enumTipoInput';

export interface CreatePerguntaCommand {
  stepId: number;
  tipoPergunta: EnumTipoInput;
  texto: string;
  obrigatoria: boolean;
  opcoes?: string[] | null;
  tipoFormatacao?: EnumInputFormat | null;
  dadoId?: number | null;
}

@Injectable()
export class CreatePerguntaUseCase {
  constructor(
    @Inject(PERGUNTA_REPOSITORY)
    private readonly perguntaRepository: IPerguntaRepository,
  ) {}

  async execute(cmd: CreatePerguntaCommand): Promise<PerguntaData> {
    const data: Omit<PerguntaData, 'id'> = {
      stepId: cmd.stepId,
      tipoPergunta: cmd.tipoPergunta,
      texto: cmd.texto,
      obrigatoria: cmd.obrigatoria,
      opcoes: cmd.opcoes ?? null,
      tipoFormatacao: cmd.tipoFormatacao ?? null,
      dadoId: cmd.dadoId ?? null,
    };
    return this.perguntaRepository.create(data);
  }
}

