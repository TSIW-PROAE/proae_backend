import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Pergunta } from '../../../../entities/pergunta/pergunta.entity';
import type {
  IPerguntaRepository,
  PerguntaData,
} from '../../../../core/domain/pergunta';

@Injectable()
export class PerguntaTypeOrmRepository implements IPerguntaRepository {
  constructor(
    @InjectRepository(Pergunta)
    private readonly perguntaRepository: Repository<Pergunta>,
  ) {}

  async findByStep(stepId: number): Promise<PerguntaData[]> {
    const perguntas = await this.perguntaRepository.find({
      where: { step: { id: stepId } },
      relations: ['dado'],
      order: { id: 'ASC' },
    });
    return perguntas.map((p) => this.toPerguntaData(p));
  }

  async create(data: Omit<PerguntaData, 'id'>): Promise<PerguntaData> {
    const entity = this.perguntaRepository.create({
      tipo_Pergunta: data.tipoPergunta,
      pergunta: data.texto,
      obrigatoriedade: data.obrigatoria,
      opcoes: data.opcoes ?? [],
      tipo_formatacao: data.tipoFormatacao ?? undefined,
      step: { id: data.stepId } as any,
      dado: data.dadoId ? ({ id: data.dadoId } as any) : undefined,
    });
    const saved = await this.perguntaRepository.save(entity);
    return this.toPerguntaData(saved);
  }

  async update(
    id: number,
    data: Partial<Omit<PerguntaData, 'id' | 'stepId'>>,
  ): Promise<PerguntaData> {
    const pergunta = await this.perguntaRepository.findOne({
      where: { id },
      relations: ['dado'],
    });
    if (!pergunta) {
      throw new Error('Pergunta não encontrada');
    }

    if (data.texto !== undefined) {
      pergunta.pergunta = data.texto;
    }
    if (data.obrigatoria !== undefined) {
      pergunta.obrigatoriedade = data.obrigatoria;
    }
    if (data.opcoes !== undefined) {
      pergunta.opcoes = data.opcoes ?? [];
    }
    if (data.tipoFormatacao !== undefined) {
      pergunta.tipo_formatacao = (data.tipoFormatacao ??
        (undefined as never)) as Pergunta['tipo_formatacao'];
    }
    if (data.dadoId !== undefined) {
      pergunta.dado = data.dadoId ? ({ id: data.dadoId } as any) : null;
    }

    const saved = await this.perguntaRepository.save(pergunta);
    return this.toPerguntaData(saved);
  }

  async remove(id: number): Promise<void> {
    await this.perguntaRepository.delete({ id });
  }

  private toPerguntaData(entity: Pergunta): PerguntaData {
    return {
      id: entity.id,
      stepId: entity.step?.id ?? 0,
      tipoPergunta: entity.tipo_Pergunta,
      texto: entity.pergunta,
      obrigatoria: entity.obrigatoriedade,
      opcoes: entity.opcoes ?? [],
      tipoFormatacao: entity.tipo_formatacao ?? null,
      dadoId: entity.dado?.id ?? null,
    };
  }
}

