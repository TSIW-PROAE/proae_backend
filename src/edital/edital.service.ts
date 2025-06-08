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
import { EtapaEdital } from 'src/entities/etapaEdital/etapaEdital.entity';
import { ResultadoEtapa } from 'src/entities/resultadoEtapa/resultadoEtapa.entity';
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
      const result = await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          const etapas = createEditalDto.etapas.map((etapaDto) => {
            return new EtapaEdital(etapaDto);
          });

          const edital = new Edital({
            ...createEditalDto,
            etapas,
          });

          const savedEdital = await transactionalEntityManager.save(edital);
          return savedEdital;
        },
      );

      return plainToInstance(EditalResponseDto, result, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error('Erro ao criar o edital:', error);
      throw new InternalServerErrorException();
    }
  }

  async findAll(): Promise<EditalResponseDto[]> {
    try {
      const editais = await this.editaisRepository.find({
        relations: {
          etapas: { resultados: true },
        },
        order: {
          etapas: { ordem: 'ASC' },
        },
      });
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
        relations: {
          etapas: { resultados: true },
        },
        order: {
          etapas: { ordem: 'ASC' },
        },
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
      const result = await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          const edital = await transactionalEntityManager.findOne(Edital, {
            where: { id },
            relations: {
              etapas: { resultados: true },
            },
          });

          if (!edital) {
            throw new NotFoundException();
          }

          // Exclui os resultados associados às etapas do edital
          for (const etapa of edital.etapas) {
            if (etapa.resultados && etapa.resultados.length > 0) {
              await transactionalEntityManager.delete(ResultadoEtapa, {
                etapa: { id: etapa.id },
              });
            }
          }

          // Exclui as etapas associadas ao edital
          await transactionalEntityManager.delete(EtapaEdital, {
            edital: { id },
          });

          // Exclui o edital
          await transactionalEntityManager.delete(Edital, { id });

          return { message: 'Edital removido com sucesso' };
        },
      );

      return result;
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
        relations: {
          etapas: { resultados: true },
        },
        order: {
          etapas: { ordem: 'ASC' },
        },
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
