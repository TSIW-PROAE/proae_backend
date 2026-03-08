import { Inject, Injectable } from '@nestjs/common';
import type { IRespostaRepository } from '../ports/resposta.repository.port';
import { RESPOSTA_REPOSITORY } from '../resposta.tokens';
import type { RespostaData } from '../../../domain/resposta';

export interface CreateRespostaCommand {
  perguntaId: number;
  inscricaoId: number;
  valorTexto?: string | null;
  valorOpcoes?: string[] | null;
  urlArquivo?: string | null;
  texto?: string | null;
}

@Injectable()
export class CreateRespostaUseCase {
  constructor(
    @Inject(RESPOSTA_REPOSITORY)
    private readonly respostaRepository: IRespostaRepository,
  ) {}

  async execute(cmd: CreateRespostaCommand): Promise<RespostaData> {
    const data: Omit<RespostaData, 'id' | 'dataResposta' | 'validada'> = {
      perguntaId: cmd.perguntaId,
      inscricaoId: cmd.inscricaoId,
      valorTexto: cmd.valorTexto ?? null,
      valorOpcoes: cmd.valorOpcoes ?? null,
      urlArquivo: cmd.urlArquivo ?? null,
      texto: cmd.texto ?? null,
      dataValidacao: null,
      dataValidade: null,
    };
    return this.respostaRepository.create(data);
  }
}

