import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateValorDadoDto } from './dto/create-valor-dado.dto';
import { ValorDado } from '../entities/valorDado/valorDado.entity';
import {
  CreateValorDadoUseCase,
  FindValoresByAlunoUseCase,
  RemoveValorDadoUseCase,
  UpdateValorDadoUseCase,
} from '../core/application/valor-dado';

@Injectable()
export class ValorDadoService {
  constructor(
    private readonly createValorDadoUseCase: CreateValorDadoUseCase,
    private readonly findValoresByAlunoUseCase: FindValoresByAlunoUseCase,
    private readonly updateValorDadoUseCase: UpdateValorDadoUseCase,
    private readonly removeValorDadoUseCase: RemoveValorDadoUseCase,
  ) {}

  async createValor(dto: CreateValorDadoDto): Promise<ValorDado> {
    try {
      const valor = await this.createValorDadoUseCase.execute({
        alunoId: dto.alunoId,
        dadoId: dto.dadoId,
        valorTexto: dto.valorTexto ?? null,
        valorOpcoes: dto.valorOpcoes ?? [],
        valorArquivo: dto.valorArquivo ?? null,
      });
      return valor as unknown as ValorDado;
    } catch (error) {
      if (error instanceof Error && error.message === 'Aluno não encontrado') {
        throw new NotFoundException('Aluno não encontrado');
      }
      if (error instanceof Error && error.message === 'Dado não encontrado') {
        throw new NotFoundException('Dado não encontrado');
      }
      throw error;
    }
  }

  async findValorByAluno(alunoId: number): Promise<ValorDado[]> {
    const valores = await this.findValoresByAlunoUseCase.execute(alunoId);
    return valores as unknown as ValorDado[];
  }

  async updateValor(id: number, dto: CreateValorDadoDto): Promise<ValorDado> {
    try {
      const valor = await this.updateValorDadoUseCase.execute(id, {
        alunoId: dto.alunoId,
        dadoId: dto.dadoId,
        valorTexto: dto.valorTexto ?? null,
        valorOpcoes: dto.valorOpcoes ?? [],
        valorArquivo: dto.valorArquivo ?? null,
      });
      return valor as unknown as ValorDado;
    } catch (error) {
      if (error instanceof Error && error.message === 'ValorDado não encontrado') {
        throw new NotFoundException('ValorDado não encontrado');
      }
      if (error instanceof Error && error.message === 'Aluno não encontrado') {
        throw new NotFoundException('Aluno não encontrado');
      }
      if (error instanceof Error && error.message === 'Dado não encontrado') {
        throw new NotFoundException('Dado não encontrado');
      }
      throw error;
    }
  }

  async removeValor(id: number): Promise<void> {
    try {
      await this.removeValorDadoUseCase.execute(id);
    } catch (error) {
      if (error instanceof Error && error.message === 'ValorDado não encontrado') {
        throw new NotFoundException('ValorDado não encontrado');
      }
      throw error;
    }
  }
}
