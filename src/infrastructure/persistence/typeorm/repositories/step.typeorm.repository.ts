import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Step } from '../../../../entities/step/step.entity';
import type {
  IStepRepository,
  StepData,
  StepWithPerguntasData,
} from '../../../../core/domain/step';

@Injectable()
export class StepTypeOrmRepository implements IStepRepository {
  constructor(
    @InjectRepository(Step)
    private readonly stepRepository: Repository<Step>,
  ) {}

  async findByEditalId(editalId: number): Promise<StepData[]> {
    const steps = await this.stepRepository.find({
      where: { edital: { id: editalId } },
      order: { id: 'ASC' },
    });
    return steps.map((s) => this.toStepData(s));
  }

  async findByEditalIdWithPerguntas(
    editalId: number,
  ): Promise<StepWithPerguntasData[]> {
    const steps = await this.stepRepository.find({
      where: { edital: { id: editalId } },
      relations: { perguntas: true },
      order: { id: 'ASC' },
    });
    return steps.map((s) => ({
      ...this.toStepData(s),
      perguntas: (s.perguntas ?? []).map((p) => ({
        id: p.id,
        pergunta: p.pergunta,
        tipo_Pergunta: p.tipo_Pergunta,
        obrigatoriedade: p.obrigatoriedade,
        opcoes: p.opcoes ?? [],
        tipo_formatacao: p.tipo_formatacao,
      })),
    }));
  }

  async create(
    data: Omit<StepData, 'id'>,
  ): Promise<StepData> {
    const entity = this.stepRepository.create({
      texto: data.texto,
      edital: { id: data.editalId } as any,
    });
    const saved = await this.stepRepository.save(entity);
    return this.toStepData(saved);
  }

  async update(id: number, data: Partial<Pick<StepData, 'texto'>>): Promise<StepData> {
    const step = await this.stepRepository.findOne({ where: { id } });
    if (!step) {
      throw new Error('Step não encontrado');
    }
    if (data.texto !== undefined) {
      step.texto = data.texto;
    }
    const saved = await this.stepRepository.save(step);
    return this.toStepData(saved);
  }

  async remove(id: number): Promise<void> {
    await this.stepRepository.delete({ id });
  }

  private toStepData(entity: Step): StepData {
    return {
      id: entity.id,
      editalId: entity.edital?.id ?? 0,
      texto: entity.texto,
      created_at: (entity as any).created_at,
      updated_at: (entity as any).updated_at,
    };
  }
}

