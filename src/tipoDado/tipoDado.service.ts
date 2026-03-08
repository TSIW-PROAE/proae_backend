import { Injectable, NotFoundException } from '@nestjs/common';
import { Dado } from '../entities/tipoDado/tipoDado.entity';
import { CreateDadoDto } from './dto/create-tipo-dado.dto';
import { UpdateDadoDto } from './dto/update-tipo-dado.dto';
import {
  CreateDadoUseCase,
  FindAllDadosUseCase,
  FindDadoByIdUseCase,
  RemoveDadoUseCase,
  UpdateDadoUseCase,
} from '../core/application/dado';

@Injectable()
export class DadoService {
  constructor(
    private readonly createDadoUseCase: CreateDadoUseCase,
    private readonly findAllDadosUseCase: FindAllDadosUseCase,
    private readonly findDadoByIdUseCase: FindDadoByIdUseCase,
    private readonly updateDadoUseCase: UpdateDadoUseCase,
    private readonly removeDadoUseCase: RemoveDadoUseCase,
  ) {}

  async create(dto: CreateDadoDto): Promise<Dado> {
    const dado = await this.createDadoUseCase.execute({
      nome: dto.nome,
      tipo: dto.tipo,
      obrigatorio: dto.obrigatorio ?? false,
      opcoes: dto.opcoes ?? [],
    });
    return dado as unknown as Dado;
  }

  async findAll(): Promise<Dado[]> {
    const dados = await this.findAllDadosUseCase.execute();
    return dados as unknown as Dado[];
  }

  async findOne(id: number): Promise<Dado> {
    const dado = await this.findDadoByIdUseCase.execute(id);
    if (!dado) throw new NotFoundException('Dado não encontrado');
    return dado as unknown as Dado;
  }

  async update(id: number, dto: UpdateDadoDto): Promise<Dado> {
    try {
      const dado = await this.updateDadoUseCase.execute(id, dto);
      return dado as unknown as Dado;
    } catch (error) {
      if (error instanceof Error && error.message === 'Dado não encontrado') {
        throw new NotFoundException('Dado não encontrado');
      }
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.removeDadoUseCase.execute(id);
  }
}
