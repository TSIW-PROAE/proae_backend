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
        ...createEditalDto,
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

      const result = await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          Object.assign(edital, updateEditalDto);
          const updatedEdital = await transactionalEntityManager.save(edital);
          return updatedEdital;
        },
      );

      return plainToInstance(EditalResponseDto, result, {
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
