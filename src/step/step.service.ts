import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { Edital } from '../entities/edital/edital.entity';
import { InputFormatPlaceholders } from '../core/shared-kernel/enums/enumInputFormat';
import { CreateStepDto } from './dto/create-step.dto';
import { UpdateStepDto } from './dto/update-step.dto';
import { PerguntaResponseDto } from './dto/response-pergunta.dto';
import {AnswerStepResponseDto } from './dto/response-step.dto';
import { StepSimpleResponseDto } from './dto/step-simple-response.dto';
import {
  CreateStepUseCase,
  FindStepsByEditalUseCase,
  FindStepsByEditalWithPerguntasUseCase,
  RemoveStepUseCase,
  UpdateStepUseCase,
} from '../core/application/step';
import type { StepData, StepWithPerguntasData } from '../core/domain/step';

@Injectable()
export class StepService {
  constructor(
    @InjectRepository(Edital)
    private readonly editalRepository: Repository<Edital>,
    private readonly createStepUseCase: CreateStepUseCase,
    private readonly findStepsByEditalUseCase: FindStepsByEditalUseCase,
    private readonly findStepsByEditalWithPerguntasUseCase: FindStepsByEditalWithPerguntasUseCase,
    private readonly updateStepUseCase: UpdateStepUseCase,
    private readonly removeStepUseCase: RemoveStepUseCase,
  ) {}

  // Buscar steps com perguntas de um edital específico
  async findStepsByEditalWithPerguntas(id: number): Promise<AnswerStepResponseDto[]> {
    try {
      const steps = await this.findStepsByEditalWithPerguntasUseCase.execute(id);
      return steps.map((step) => {
        const transformedStep = plainToInstance(AnswerStepResponseDto, {
          id: step.id,
          texto: step.texto,
          perguntas: [],
        }, {
          excludeExtraneousValues: true,
        });
        const transformedPerguntas = (step.perguntas ?? []).map((pergunta) => {
          const perguntaDto = plainToInstance(PerguntaResponseDto, pergunta, {
            excludeExtraneousValues: true,
          });

          perguntaDto.placeholder =
            InputFormatPlaceholders[
              (pergunta.tipo_formatacao ?? 'none') as keyof typeof InputFormatPlaceholders
            ];

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
      const steps = await this.findStepsByEditalUseCase.execute(id);
      return plainToInstance(StepSimpleResponseDto, steps.map((step) => ({
        id: step.id,
        texto: step.texto,
        created_at: step.created_at,
        updated_at: step.updated_at,
      })), {
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
      const edital = await this.editalRepository.findOneBy({
        id: createStepDto.edital_id,
      });

      if (!edital) {
        throw new NotFoundException('Edital não encontrado');
      }

      const savedStep = await this.createStepUseCase.execute({
        editalId: createStepDto.edital_id,
        texto: createStepDto.texto,
      });
      return plainToInstance(StepSimpleResponseDto, {
        id: savedStep.id,
        texto: savedStep.texto,
        created_at: savedStep.created_at,
        updated_at: savedStep.updated_at,
      }, {
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
  async update(
    id: number,
    updateStepDto: UpdateStepDto,
  ): Promise<StepSimpleResponseDto> {
    try {
      const updatedStep = await this.updateStepUseCase.execute(id, updateStepDto.texto);
      return plainToInstance(StepSimpleResponseDto, {
        id: updatedStep.id,
        texto: updatedStep.texto,
        created_at: updatedStep.created_at,
        updated_at: updatedStep.updated_at,
      }, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Step não encontrado') {
        throw new NotFoundException('Step não encontrado');
      }
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
      await this.removeStepUseCase.execute(id);

      return { message: 'Step removido com sucesso' };
    } catch (error) {
      if (error instanceof Error && error.message === 'Step não encontrado') {
        throw new NotFoundException('Step não encontrado');
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao remover step:', error);
      throw new InternalServerErrorException();
    }
  }

  // Manter compatibilidade com método antigo
  async findStepsByEdital_OLD(id: number): Promise<AnswerStepResponseDto[]> {
    return this.findStepsByEditalWithPerguntas(id);
  }
}
