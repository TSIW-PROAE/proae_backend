import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { CloneFormularioUseCase } from 'src/core/application/step/use-cases/clone-formulario.use-case';
import { CreateStepUseCase } from 'src/core/application/step/use-cases/create-step.use-case';
import { FindStepsByEditalWithPerguntasUseCase } from 'src/core/application/step/use-cases/find-steps-by-edital-with-perguntas.use-case';
import { FindStepsByEditalUseCase } from 'src/core/application/step/use-cases/find-steps-by-edital.use-case';
import { RemoveStepUseCase } from 'src/core/application/step/use-cases/remove-step.use-case';
import { ReorderStepsUseCase } from 'src/core/application/step/use-cases/reorder-steps.use-case';
import { UpdateStepUseCase } from 'src/core/application/step/use-cases/update-step.use-case';
import { InputFormatPlaceholders } from 'src/core/shared-kernel/enums/enumInputFormat';
import { Edital } from 'src/infrastructure/persistence/typeorm/entities/edital/edital.entity';
import { CreateStepDto } from './dto/create-step.dto';
import { ReorderStepsDto } from './dto/reorder-steps.dto';
import { PerguntaResponseDto } from './dto/response-pergunta.dto';
import { AnswerStepResponseDto } from './dto/response-step.dto';
import { StepSimpleResponseDto } from './dto/step-simple-response.dto';
import { UpdateStepDto } from './dto/update-step.dto';

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
    private readonly reorderStepsUseCase: ReorderStepsUseCase,
    private readonly cloneFormularioUseCase: CloneFormularioUseCase,
  ) {}

  async findStepsByEditalWithPerguntas(id: number): Promise<AnswerStepResponseDto[]> {
    try {
      const steps = await this.findStepsByEditalWithPerguntasUseCase.execute(id);
      return steps.map((step) => {
        const transformedStep = plainToInstance(AnswerStepResponseDto, {
          id: step.id,
          texto: step.texto,
          ordem: step.ordem ?? 0,
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
          perguntaDto.ordem = pergunta.ordem ?? 0;
          perguntaDto.condicao = pergunta.condicao ?? null;

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

  async findStepsByEdital(id: number): Promise<StepSimpleResponseDto[]> {
    try {
      const steps = await this.findStepsByEditalUseCase.execute(id);
      return plainToInstance(StepSimpleResponseDto, steps.map((step) => ({
        id: step.id,
        texto: step.texto,
        ordem: step.ordem ?? 0,
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
        ordem: savedStep.ordem ?? 0,
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

  async update(
    id: number,
    updateStepDto: UpdateStepDto,
  ): Promise<StepSimpleResponseDto> {
    try {
      const updatedStep = await this.updateStepUseCase.execute(id, {
        texto: updateStepDto.texto,
        ordem: updateStepDto.ordem,
      });
      return plainToInstance(StepSimpleResponseDto, {
        id: updatedStep.id,
        texto: updatedStep.texto,
        ordem: updatedStep.ordem ?? 0,
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

  async findStepsByEdital_OLD(id: number): Promise<AnswerStepResponseDto[]> {
    return this.findStepsByEditalWithPerguntas(id);
  }

  /**
   * Clona o formulário (steps + perguntas) de um edital de origem para um
   * edital alvo. Mantém ordem, opções, condições (re-mapeadas) e tipo formatação.
   */
  async cloneFormulario(
    editalAlvoId: number,
    editalOrigemId: number,
    substituirExistente: boolean,
  ): Promise<{ stepsCriados: number; perguntasCriadas: number }> {
    try {
      const alvo = await this.editalRepository.findOneBy({ id: editalAlvoId });
      if (!alvo) {
        throw new NotFoundException(
          `Edital alvo ${editalAlvoId} não encontrado.`,
        );
      }
      return await this.cloneFormularioUseCase.execute({
        editalOrigemId,
        editalAlvoId,
        substituirExistente,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao clonar formulário:', error);
      throw new InternalServerErrorException();
    }
  }

  /**
   * Reordena steps de um edital. Aplica em transação. Não recria registros —
   * apenas atualiza o campo `ordem`.
   */
  async reorderByEdital(
    editalId: number,
    dto: ReorderStepsDto,
  ): Promise<{ message: string }> {
    try {
      const edital = await this.editalRepository.findOneBy({ id: editalId });
      if (!edital) {
        throw new NotFoundException(
          `Edital com ID ${editalId} não encontrado.`,
        );
      }
      await this.reorderStepsUseCase.execute({
        editalId,
        updates: dto.itens.map((it) => ({ id: it.id, ordem: it.ordem })),
      });
      return { message: 'Steps reordenados com sucesso' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao reordenar steps:', error);
      throw new InternalServerErrorException();
    }
  }
}
