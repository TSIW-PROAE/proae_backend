import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { EntityManager, Repository } from 'typeorm';
import { CreateEditalDto } from './dto/create-edital.dto';
import { UpdateEditalDto } from './dto/update-edital.dto';
import { Edital } from 'src/entities/edital/edital.entity';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';

import { StatusEdital } from 'src/enum/enumStatusEdital';
import { EditalResponseDto } from './dto/edital-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class EditalService {
  constructor(
    @InjectRepository(Edital)
    private readonly editaisRepository: Repository<Edital>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async create(createEditalDto: CreateEditalDto): Promise<EditalResponseDto> {
    try {
      const edital = new Edital({
        titulo_edital: createEditalDto.titulo_edital,
        status_edital: StatusEdital.RASCUNHO,
        descricao: undefined,
        edital_url: undefined,
        etapa_edital: undefined,
      });

      const savedEdital = await this.editaisRepository.save(edital);

      return plainToInstance(EditalResponseDto, savedEdital, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error('Erro ao criar o edital:', error);
      throw new InternalServerErrorException();
    }
  }

  async findAll(): Promise<EditalResponseDto[]> {
    try {
      const editais = await this.editaisRepository.find();
      return plainToInstance(EditalResponseDto, editais, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error('Erro ao buscar editais:', error);
      throw new InternalServerErrorException();
    }
  }

  async findOne(id: number): Promise<EditalResponseDto> {
    try {
      const edital = await this.editaisRepository.findOne({
        where: { id },
      });

      if (!edital) {
        throw new NotFoundException();
      }

      return plainToInstance(EditalResponseDto, edital, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao buscar edital:', error);
      throw new InternalServerErrorException();
    }
  }

  async update(
    id: number,
    updateEditalDto: UpdateEditalDto,
  ): Promise<EditalResponseDto> {
    try {
      const edital = await this.editaisRepository.findOneBy({ id });

      if (!edital) {
        throw new NotFoundException();
      }

      await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          // Remove status_edital do DTO para garantir que não seja atualizado
          const { ...updateData } = updateEditalDto;
          
          // Aplica as atualizações, exceto status_edital
          Object.assign(edital, updateData);
          
          await transactionalEntityManager.save(edital);
        },
      );

      // Busca os dados atualizados do banco para garantir que temos todos os dados
      const updatedEdital = await this.editaisRepository.findOneBy({ id });

      return plainToInstance(EditalResponseDto, updatedEdital, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao atualizar o edital:', error);
      throw new InternalServerErrorException();
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    try {
      const edital = await this.editaisRepository.findOne({
        where: { id },
      });

      if (!edital) {
        throw new NotFoundException();
      }

      await this.editaisRepository.delete({ id });

      return { message: 'Edital removido com sucesso' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Falha ao excluir edital:', error);
      throw new InternalServerErrorException();
    }
  }

  async getEditalOpedened(): Promise<EditalResponseDto[]> {
    try {
      const editais = await this.editaisRepository.find({
        where: { status_edital: StatusEdital.ABERTO },
      });
      return plainToInstance(EditalResponseDto, editais, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error('Erro ao buscar editais abertos:', error);
      throw new InternalServerErrorException();
    }
  }
}
