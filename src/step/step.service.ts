import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Step } from '../entities/edital/step.entity';
import { StepResponseDto } from './dto/response-step.dto';
import { PerguntaResponseDto } from './dto/response-pergunta.dto';
import { plainToInstance } from 'class-transformer';
import { InputFormatPlaceholders } from '../enum/enumInputFormat';

@Injectable()
export class StepService {
  constructor(
    @InjectRepository(Step)
    private readonly stepRepository: Repository<Step>,
  ) {}

  async findStepsByEdital(id: number): Promise<StepResponseDto[]> {
    try {
      const steps = await this.stepRepository.find({
        where: { edital: { id } },
        relations: {
          perguntas: true
        }
      });

      if (!steps || steps.length === 0) {
        throw new NotFoundException('Nenhum step encontrado para este edital');
      }

      // Transform steps and their perguntas
      return steps.map(step => {
        const transformedStep = plainToInstance(StepResponseDto, step, {
          excludeExtraneousValues: true,
        });

        // Transform perguntas separately to ensure placeholder is calculated
        const transformedPerguntas = step.perguntas.map(pergunta => {
          const perguntaDto = plainToInstance(PerguntaResponseDto, pergunta, {
            excludeExtraneousValues: true,
          });

          perguntaDto.placeholder = InputFormatPlaceholders[pergunta.tipo_formatacao];

          return perguntaDto;
        });

        return {
          ...transformedStep,
          perguntas: transformedPerguntas
        };
      });
    } catch (error) {
      console.error('Erro ao buscar step:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException();
    }
  }
} 