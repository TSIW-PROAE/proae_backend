import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { EntityManager, Repository } from 'typeorm';
import { Step } from '../entities/edital/step.entity';
import { Edital } from '../entities/edital/edital.entity';
import { InputFormatPlaceholders } from '../enum/enumInputFormat';
import { CreateStepDto } from './dto/create-step.dto';
import { UpdateStepDto } from './dto/update-step.dto';
import { PerguntaResponseDto } from './dto/response-pergunta.dto';
import { StepResponseDto } from './dto/response-step.dto';
import { StepSimpleResponseDto } from './dto/step-simple-response.dto';

@Injectable()
export class StepService {
  constructor(
    @InjectRepository(Step) private readonly stepRepository: Repository<Step>,
    @InjectRepository(Edital) private readonly editalRepository: Repository<Edital>,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  // Buscar steps com perguntas de um edital específico
  async findStepsByEditalWithPerguntas(id: number): Promise<StepResponseDto[]> {
    try {
      const steps = await this.stepRepository.find({
        where: { edital: { id } },
        relations: {
          perguntas: true,
        },
      });

      // if (!steps || steps.length === 0) {
      //   throw new NotFoundException('Nenhum step encontrado para este edital');
      // }

      // Transform steps and their perguntas
      return steps.map((step) => {
        const transformedStep = plainToInstance(StepResponseDto, step, {
          excludeExtraneousValues: true,
        });

        // Transform perguntas separately to ensure placeholder is calculated
        const transformedPerguntas = step.perguntas.map((pergunta) => {
          const perguntaDto = plainToInstance(PerguntaResponseDto, pergunta, {
            excludeExtraneousValues: true,
          });

          perguntaDto.placeholder =
            InputFormatPlaceholders[pergunta.tipo_formatacao];

          return perguntaDto;
        });

        return {
          ...transformedStep,
          perguntas: transformedPerguntas,
        };
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao buscar steps com perguntas:', error);
      throw new InternalServerErrorException();
    }
  }

  // Buscar apenas steps (sem perguntas) de um edital específico
  async findStepsByEdital(id: number): Promise<StepSimpleResponseDto[]> {
    try {
      const steps = await this.stepRepository.find({
        where: { edital: { id } },
      });

      // if (!steps || steps.length === 0) {
      //   throw new NotFoundException('Nenhum step encontrado para este edital');
      // }

      return plainToInstance(StepSimpleResponseDto, steps, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao buscar steps:', error);
      throw new InternalServerErrorException();
    }
  }

  // Criar um novo step
  async create(createStepDto: CreateStepDto): Promise<StepSimpleResponseDto> {
    try {
      // Verificar se o edital existe
      const edital = await this.editalRepository.findOneBy({ id: createStepDto.edital_id });
      
      if (!edital) {
        throw new NotFoundException('Edital não encontrado');
      }

      const step = new Step({
        texto: createStepDto.texto,
        edital: edital,
      });

      const savedStep = await this.stepRepository.save(step);

      return plainToInstance(StepSimpleResponseDto, savedStep, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao criar step:', error);
      throw new InternalServerErrorException();
    }
  }

  // Atualizar um step
  async update(id: number, updateStepDto: UpdateStepDto): Promise<StepSimpleResponseDto> {
    try {
      const step = await this.stepRepository.findOneBy({ id });

      if (!step) {
        throw new NotFoundException('Step não encontrado');
      }

      await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          Object.assign(step, updateStepDto);
          await transactionalEntityManager.save(step);
        },
      );

      // Busca os dados atualizados
      const updatedStep = await this.stepRepository.findOneBy({ id });

      return plainToInstance(StepSimpleResponseDto, updatedStep, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao atualizar step:', error);
      throw new InternalServerErrorException();
    }
  }

  // Remover um step
  async remove(id: number): Promise<{ message: string }> {
    try {
      const step = await this.stepRepository.findOne({
        where: { id },
      });

      if (!step) {
        throw new NotFoundException('Step não encontrado');
      }

      await this.stepRepository.delete({ id });

      return { message: 'Step removido com sucesso' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao remover step:', error);
      throw new InternalServerErrorException();
    }
  }

  // Manter compatibilidade com método antigo
  async findStepsByEdital_OLD(id: number): Promise<StepResponseDto[]> {
    return this.findStepsByEditalWithPerguntas(id);
  }
}
