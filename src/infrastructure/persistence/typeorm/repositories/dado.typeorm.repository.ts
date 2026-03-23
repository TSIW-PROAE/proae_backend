import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Dado } from '../entities/tipoDado/tipoDado.entity';
import type { DadoData } from '../../../../core/domain/dado/dado.types';
import type { IDadoRepository } from '../../../../core/domain/dado/ports/dado.repository.port';

@Injectable()
export class DadoTypeOrmRepository implements IDadoRepository {
  constructor(
    @InjectRepository(Dado)
    private readonly dadoRepository: Repository<Dado>,
  ) {}

  async create(
    data: Omit<DadoData, 'id'>,
  ): Promise<DadoData> {
    const entity = this.dadoRepository.create({
      nome: data.nome,
      tipo: data.tipo,
      obrigatorio: data.obrigatorio,
      opcoes: data.opcoes ?? [],
    });
    const saved = await this.dadoRepository.save(entity);
    return this.toDadoData(saved);
  }

  async findAll(): Promise<DadoData[]> {
    const dados = await this.dadoRepository.find({ relations: ['valores'] });
    return dados.map((d) => this.toDadoData(d));
  }

  async findOne(id: number): Promise<DadoData | null> {
    const dado = await this.dadoRepository.findOne({
      where: { id },
      relations: ['valores'],
    });
    if (!dado) return null;
    return this.toDadoData(dado);
  }

  async update(id: number, data: Partial<Omit<DadoData, 'id'>>): Promise<DadoData> {
    const dado = await this.dadoRepository.findOne({ where: { id } });
    if (!dado) throw new Error('Dado não encontrado');

    if (data.nome !== undefined) dado.nome = data.nome;
    if (data.tipo !== undefined) dado.tipo = data.tipo;
    if (data.obrigatorio !== undefined) dado.obrigatorio = data.obrigatorio;
    if (data.opcoes !== undefined) dado.opcoes = data.opcoes ?? [];

    const saved = await this.dadoRepository.save(dado);
    return this.toDadoData(saved);
  }

  async remove(id: number): Promise<void> {
    await this.dadoRepository.delete({ id });
  }

  private toDadoData(entity: Dado): DadoData {
    return {
      id: entity.id,
      nome: entity.nome,
      tipo: entity.tipo,
      obrigatorio: entity.obrigatorio,
      opcoes: entity.opcoes ?? [],
    };
  }
}

