import type {
  RespostaData,
  RespostaConsultaResultado,
  ValidateRespostaCommand,
} from '../resposta.types';

/**
 * Porta do repositório de Resposta no domínio.
 * Define operações básicas; queries mais ricas podem ser adicionadas depois.
 */
export interface IRespostaRepository {
  create(data: Omit<RespostaData, 'id' | 'dataResposta' | 'validada'>): Promise<RespostaData>;
  findAll(): Promise<RespostaData[]>;
  findOne(id: number): Promise<RespostaData | null>;
  update(id: number, data: Partial<Omit<RespostaData, 'id'>>): Promise<RespostaData>;
  remove(id: number): Promise<void>;
  findRespostasAlunoEdital(
    alunoId: number,
    editalId: number,
  ): Promise<RespostaConsultaResultado>;
  findRespostasAlunoStep(
    alunoId: number,
    editalId: number,
    stepId: number,
  ): Promise<RespostaConsultaResultado>;
  findRespostasPerguntaEdital(
    perguntaId: number,
    editalId: number,
  ): Promise<RespostaConsultaResultado>;
  findPerguntasComRespostasAlunoStep(
    alunoId: number,
    editalId: number,
    stepId: number,
  ): Promise<RespostaConsultaResultado>;
  validateResposta(
    respostaId: number,
    cmd: ValidateRespostaCommand,
  ): Promise<RespostaConsultaResultado>;
}

