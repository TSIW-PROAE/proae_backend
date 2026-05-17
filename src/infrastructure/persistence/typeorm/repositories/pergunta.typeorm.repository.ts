import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Pergunta } from '../entities/pergunta/pergunta.entity';
import type {
  PerguntaData,
} from '../../../../core/domain/pergunta/pergunta.types';
import type { IPerguntaRepository } from '../../../../core/domain/pergunta/ports/pergunta.repository.port';

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
      order: { ordem: 'ASC', id: 'ASC' },
    });
    return perguntas.map((p) => this.toPerguntaData(p));
  }

  async create(data: Omit<PerguntaData, 'id'>): Promise<PerguntaData> {
    let ordem = data.ordem;
    if (ordem === undefined || ordem === null) {
      const last = await this.perguntaRepository.findOne({
        where: { step: { id: data.stepId } },
        order: { ordem: 'DESC', id: 'DESC' },
      });
      ordem = ((last?.ordem ?? 0) || 0) + 1;
    }
    const entity = this.perguntaRepository.create({
      tipo_Pergunta: data.tipoPergunta,
      pergunta: data.texto,
      obrigatoriedade: data.obrigatoria,
      opcoes: data.opcoes ?? [],
      tipo_formatacao: data.tipoFormatacao ?? undefined,
      ordem,
      condicao: data.condicao ?? null,
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
    if (data.ordem !== undefined && data.ordem !== null) {
      pergunta.ordem = data.ordem;
    }
    if (data.condicao !== undefined) {
      pergunta.condicao = data.condicao ?? null;
    }

    const saved = await this.perguntaRepository.save(pergunta);
    return this.toPerguntaData(saved);
  }

  async remove(id: number): Promise<void> {
    await this.perguntaRepository.delete({ id });
  }

  /**
   * Reordenação em lote, restrita às perguntas que pertencem ao step informado.
   */
  async reorderByStep(
    stepId: number,
    updates: { id: number; ordem: number }[],
  ): Promise<void> {
    if (!updates.length) return;
    await this.perguntaRepository.manager.transaction(async (manager) => {
      const perguntas = await manager.find(Pergunta, {
        where: { step: { id: stepId } },
      });
      const owned = new Set(perguntas.map((p) => p.id));
      for (const u of updates) {
        if (!owned.has(u.id)) continue;
        await manager.update(Pergunta, { id: u.id }, { ordem: u.ordem });
      }
    });
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
      ordem: entity.ordem ?? 0,
      condicao: (entity.condicao ?? null) as PerguntaData['condicao'],
    };
  }
}

