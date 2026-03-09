import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { Edital } from 'src/infrastructure/persistence/typeorm/entities/edital/edital.entity';
import { CreateVagaDto } from './dto/create-vaga.dto';
import { UpdateVagaDto } from './dto/update-vaga.dto';
import { VagaResponseDto } from './dto/vaga-response.dto';
import { CreateVagaUseCase } from 'src/core/application/vaga/use-cases/create-vaga.use-case';
import { FindVagasByEditalUseCase } from 'src/core/application/vaga/use-cases/find-vagas-by-edital.use-case';
import { RemoveVagaUseCase } from 'src/core/application/vaga/use-cases/remove-vaga.use-case';
import { UpdateVagaUseCase } from 'src/core/application/vaga/use-cases/update-vaga.use-case';
import type { VagaData } from 'src/core/domain/vaga/vaga.types';

@Injectable()
export class VagasService {
  constructor(
    @InjectRepository(Edital)
    private readonly editalRepository: Repository<Edital>,
    private readonly createVagaUseCase: CreateVagaUseCase,
    private readonly findVagasByEditalUseCase: FindVagasByEditalUseCase,
    private readonly updateVagaUseCase: UpdateVagaUseCase,
    private readonly removeVagaUseCase: RemoveVagaUseCase,
  ) {}

  async create(createVagaDto: CreateVagaDto): Promise<VagaResponseDto> {
    try {
      const edital = await this.editalRepository.findOneBy({
        id: createVagaDto.edital_id,
      });

      if (!edital) {
        throw new NotFoundException(
          `Edital com ID ${createVagaDto.edital_id} não encontrado. Verifique se o edital existe e tente novamente.`,
        );
      }

      const savedVaga = await this.createVagaUseCase.execute({
        edital_id: createVagaDto.edital_id,
        beneficio: createVagaDto.beneficio,
        descricao_beneficio: createVagaDto.descricao_beneficio,
        numero_vagas: createVagaDto.numero_vagas,
      });
      return this.toResponse(savedVaga);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao criar vaga:', error);
      throw new InternalServerErrorException();
    }
  }

  async findByEdital(editalId: number): Promise<VagaResponseDto[]> {
    try {
      const vagas = await this.findVagasByEditalUseCase.execute(editalId);
      return vagas.map((v) => this.toResponse(v));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao buscar vagas:', error);
      throw new InternalServerErrorException();
    }
  }

  async update(id: number, updateVagaDto: UpdateVagaDto): Promise<VagaResponseDto> {
    try {
      const updatedVaga = await this.updateVagaUseCase.execute(id, updateVagaDto);
      return this.toResponse(updatedVaga);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === `Vaga com ID ${id} não encontrada.`
      ) {
        throw new NotFoundException(`Vaga com ID ${id} não encontrada.`);
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao atualizar vaga:', error);
      throw new InternalServerErrorException();
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    try {
      await this.removeVagaUseCase.execute(id);
      return { message: 'Vaga removida com sucesso' };
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === `Vaga com ID ${id} não encontrada.`
      ) {
        throw new NotFoundException(`Vaga com ID ${id} não encontrada.`);
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao remover vaga:', error);
      throw new InternalServerErrorException();
    }
  }

  private toResponse(vaga: VagaData): VagaResponseDto {
    return plainToInstance(
      VagaResponseDto,
      {
        id: vaga.id,
        beneficio: vaga.beneficio,
        descricao_beneficio: vaga.descricao_beneficio,
        numero_vagas: vaga.numero_vagas,
        created_at: vaga.created_at,
        updated_at: vaga.updated_at,
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }
}
