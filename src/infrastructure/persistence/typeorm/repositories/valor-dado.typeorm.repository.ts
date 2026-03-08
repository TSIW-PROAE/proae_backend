import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { ValorDado } from '../../../../entities/valorDado/valorDado.entity';
import { Dado } from '../../../../entities/tipoDado/tipoDado.entity';
import { Aluno } from '../../../../entities/aluno/aluno.entity';
import type {
  IValorDadoRepository,
  ValorDadoData,
} from '../../../../core/domain/valor-dado';

@Injectable()
export class ValorDadoTypeOrmRepository implements IValorDadoRepository {
  constructor(
    @InjectRepository(ValorDado)
    private readonly valorDadoRepository: Repository<ValorDado>,
    @InjectRepository(Dado)
    private readonly dadoRepository: Repository<Dado>,
    @InjectRepository(Aluno)
    private readonly alunoRepository: Repository<Aluno>,
  ) {}

  async create(
    data: Omit<ValorDadoData, 'id'>,
  ): Promise<ValorDadoData> {
    const aluno = await this.alunoRepository.findOneBy({ aluno_id: data.alunoId });
    if (!aluno) throw new Error('Aluno não encontrado');

    const dado = await this.dadoRepository.findOneBy({ id: data.dadoId });
    if (!dado) throw new Error('Dado não encontrado');

    const valor = this.valorDadoRepository.create({
      valorTexto: data.valorTexto ?? '',
      valorOpcoes: data.valorOpcoes ?? [],
      valorArquivo: data.valorArquivo ?? '',
      aluno,
      dado,
    });
    const saved = await this.valorDadoRepository.save(valor);
    return this.toValorDadoData(saved);
  }

  async findByAlunoId(alunoId: number): Promise<ValorDadoData[]> {
    const valores = await this.valorDadoRepository.find({
      where: { aluno: { aluno_id: alunoId } },
      relations: ['dado'],
    });
    return valores.map((v) => this.toValorDadoData(v));
  }

  async update(
    id: number,
    data: Partial<Omit<ValorDadoData, 'id'>>,
  ): Promise<ValorDadoData> {
    const valor = await this.valorDadoRepository.findOne({ where: { id } });
    if (!valor) throw new Error('ValorDado não encontrado');

    if (data.alunoId !== undefined) {
      const aluno = await this.alunoRepository.findOneBy({ aluno_id: data.alunoId });
      if (!aluno) throw new Error('Aluno não encontrado');
      valor.aluno = aluno;
    }
    if (data.dadoId !== undefined) {
      const dado = await this.dadoRepository.findOneBy({ id: data.dadoId });
      if (!dado) throw new Error('Dado não encontrado');
      valor.dado = dado;
    }
    if (data.valorTexto !== undefined) valor.valorTexto = data.valorTexto ?? '';
    if (data.valorOpcoes !== undefined) valor.valorOpcoes = data.valorOpcoes ?? [];
    if (data.valorArquivo !== undefined) valor.valorArquivo = data.valorArquivo ?? '';

    const saved = await this.valorDadoRepository.save(valor);
    return this.toValorDadoData(saved);
  }

  async remove(id: number): Promise<void> {
    const valor = await this.valorDadoRepository.findOne({ where: { id } });
    if (!valor) throw new Error('ValorDado não encontrado');
    await this.valorDadoRepository.remove(valor);
  }

  private toValorDadoData(entity: ValorDado): ValorDadoData {
    return {
      id: entity.id,
      alunoId: entity.aluno?.aluno_id ?? 0,
      dadoId: entity.dado?.id ?? 0,
      valorTexto: entity.valorTexto ?? null,
      valorOpcoes: entity.valorOpcoes ?? [],
      valorArquivo: entity.valorArquivo ?? null,
    };
  }
}

