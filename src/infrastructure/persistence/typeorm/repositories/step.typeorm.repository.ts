import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Step } from '../entities/step/step.entity';
import type {
  StepData,
  StepWithPerguntasData,
} from '../../../../core/domain/step/step.types';
import type { IStepRepository } from '../../../../core/domain/step/ports/step.repository.port';

@Injectable()
export class StepTypeOrmRepository implements IStepRepository {
  constructor(
    @InjectRepository(Step)
    private readonly stepRepository: Repository<Step>,
  ) {}

  async findByEditalId(editalId: number): Promise<StepData[]> {
    const steps = await this.stepRepository.find({
      where: { edital: { id: editalId } },
      order: { ordem: 'ASC', id: 'ASC' },
    });
    return steps.map((s) => this.toStepData(s));
  }

  async findByEditalIdWithPerguntas(
    editalId: number,
  ): Promise<StepWithPerguntasData[]> {
    const steps = await this.stepRepository.find({
      where: { edital: { id: editalId } },
      relations: { perguntas: true },
      order: { ordem: 'ASC', id: 'ASC' },
    });
    return steps.map((s) => ({
      ...this.toStepData(s),
      perguntas: (s.perguntas ?? [])
        .slice()
        .sort((a, b) => {
          const oa = a.ordem ?? 0;
          const ob = b.ordem ?? 0;
          return oa === ob ? a.id - b.id : oa - ob;
        })
        .map((p) => ({
          id: p.id,
          pergunta: p.pergunta,
          tipo_Pergunta: p.tipo_Pergunta,
          obrigatoriedade: p.obrigatoriedade,
          opcoes: p.opcoes ?? [],
          tipo_formatacao: p.tipo_formatacao,
          ordem: p.ordem ?? 0,
          condicao: (p.condicao ?? null) as
            | StepWithPerguntasData['perguntas'][number]['condicao']
            | null,
        })),
    }));
  }

  async create(
    data: Omit<StepData, 'id'>,
  ): Promise<StepData> {
    // Define ordem como (max + 1) se não informada, evitando colisão com o
    // default 0 que faria todos os novos steps caírem no topo.
    let ordem = data.ordem;
    if (ordem === undefined || ordem === null) {
      const last = await this.stepRepository.findOne({
        where: { edital: { id: data.editalId } },
        order: { ordem: 'DESC', id: 'DESC' },
      });
      ordem = ((last?.ordem ?? 0) || 0) + 1;
    }
    const entity = this.stepRepository.create({
      texto: data.texto,
      ordem,
      edital: { id: data.editalId } as any,
    });
    const saved = await this.stepRepository.save(entity);
    return this.toStepData(saved);
  }

  async update(
    id: number,
    data: Partial<Pick<StepData, 'texto' | 'ordem'>>,
  ): Promise<StepData> {
    const step = await this.stepRepository.findOne({ where: { id } });
    if (!step) {
      throw new Error('Step não encontrado');
    }
    if (data.texto !== undefined) {
      step.texto = data.texto;
    }
    if (data.ordem !== undefined && data.ordem !== null) {
      step.ordem = data.ordem;
    }
    const saved = await this.stepRepository.save(step);
    return this.toStepData(saved);
  }

  async remove(id: number): Promise<void> {
    await this.stepRepository.delete({ id });
  }

  /**
   * Reordenação em lote: aplica as ordens recebidas dentro do mesmo edital.
   * Usa transação para evitar inconsistências caso uma das atualizações falhe.
   */
  async reorderByEdital(
    editalId: number,
    updates: { id: number; ordem: number }[],
  ): Promise<void> {
    if (!updates.length) return;
    await this.stepRepository.manager.transaction(async (manager) => {
      const steps = await manager.find(Step, {
        where: { edital: { id: editalId } },
      });
      const owned = new Set(steps.map((s) => s.id));
      for (const u of updates) {
        if (!owned.has(u.id)) continue;
        await manager.update(Step, { id: u.id }, { ordem: u.ordem });
      }
    });
  }

  private toStepData(entity: Step): StepData {
    return {
      id: entity.id,
      editalId: entity.edital?.id ?? 0,
      texto: entity.texto,
      ordem: entity.ordem ?? 0,
      created_at: (entity as any).created_at,
      updated_at: (entity as any).updated_at,
    };
  }
}

