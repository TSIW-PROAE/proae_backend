import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Vagas } from '../entities/vagas/vagas.entity';
import type { VagaData } from '../../../../core/domain/vaga/vaga.types';
import type { IVagaRepository } from '../../../../core/domain/vaga/ports/vaga.repository.port';

@Injectable()
export class VagaTypeOrmRepository implements IVagaRepository {
  constructor(
    @InjectRepository(Vagas)
    private readonly vagasRepository: Repository<Vagas>,
  ) {}

  async create(data: Omit<VagaData, 'id'>): Promise<VagaData> {
    const vaga = this.vagasRepository.create({
      beneficio: data.beneficio,
      descricao_beneficio: data.descricao_beneficio,
      numero_vagas: data.numero_vagas,
      edital: { id: data.edital_id } as any,
    });
    const saved = await this.vagasRepository.save(vaga);
    return this.toVagaData(saved);
  }

  async findByEdital(editalId: number): Promise<VagaData[]> {
    const vagas = await this.vagasRepository.find({
      where: { edital: { id: editalId } },
    });
    return vagas.map((v) => this.toVagaData(v));
  }

  async findById(id: number): Promise<VagaData | null> {
    const vaga = await this.vagasRepository.findOne({ where: { id } });
    if (!vaga) return null;
    return this.toVagaData(vaga);
  }

  async update(
    id: number,
    data: Partial<Omit<VagaData, 'id' | 'edital_id'>>,
  ): Promise<VagaData> {
    const vaga = await this.vagasRepository.findOne({ where: { id } });
    if (!vaga) throw new Error(`Vaga com ID ${id} não encontrada.`);

    if (data.beneficio !== undefined) vaga.beneficio = data.beneficio;
    if (data.descricao_beneficio !== undefined) {
      vaga.descricao_beneficio = data.descricao_beneficio;
    }
    if (data.numero_vagas !== undefined) vaga.numero_vagas = data.numero_vagas;

    const saved = await this.vagasRepository.save(vaga);
    return this.toVagaData(saved);
  }

  async remove(id: number): Promise<void> {
    const vaga = await this.vagasRepository.findOne({ where: { id } });
    if (!vaga) throw new Error(`Vaga com ID ${id} não encontrada.`);
    await this.vagasRepository.delete({ id });
  }

  private toVagaData(entity: Vagas): VagaData {
    return {
      id: entity.id,
      edital_id: entity.edital?.id ?? 0,
      beneficio: entity.beneficio,
      descricao_beneficio: entity.descricao_beneficio,
      numero_vagas: entity.numero_vagas,
      created_at: (entity as any).created_at,
      updated_at: (entity as any).updated_at,
    };
  }
}

