import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { CreatePerguntaUseCase } from 'src/core/application/pergunta/use-cases/create-pergunta.use-case';
import { FindPerguntasByStepUseCase } from 'src/core/application/pergunta/use-cases/find-perguntas-by-step.use-case';
import { RemovePerguntaUseCase } from 'src/core/application/pergunta/use-cases/remove-pergunta.use-case';
import { UpdatePerguntaUseCase } from 'src/core/application/pergunta/use-cases/update-pergunta.use-case';
import type { PerguntaData } from 'src/core/domain/pergunta/pergunta.types';
import { InputFormatPlaceholders } from 'src/core/shared-kernel/enums/enumInputFormat';
import { Step } from 'src/infrastructure/persistence/typeorm/entities/step/step.entity';
import { Dado } from 'src/infrastructure/persistence/typeorm/entities/tipoDado/tipoDado.entity';
import { PerguntaResponseDto } from 'src/presentation/http/modules/step/dto/response-pergunta.dto';
import { CreatePerguntaDto } from './dto/create-pergunta.dto';
import { UpdatePerguntaDto } from './dto/update-pergunta.dto';

@Injectable()
export class PerguntaService {
  constructor(
    @InjectRepository(Step) private readonly stepRepository: Repository<Step>,
    @InjectRepository(Dado) private readonly dadoRepository: Repository<Dado>,
    private readonly findPerguntasByStepUseCase: FindPerguntasByStepUseCase,
    private readonly createPerguntaUseCase: CreatePerguntaUseCase,
    private readonly updatePerguntaUseCase: UpdatePerguntaUseCase,
    private readonly removePerguntaUseCase: RemovePerguntaUseCase,
  ) {}

  async findByStep(stepId: number): Promise<PerguntaResponseDto[]> {
    try {
      const perguntas = await this.findPerguntasByStepUseCase.execute(stepId);
      return Promise.all(perguntas.map((pergunta) => this.toResponse(pergunta)));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao buscar perguntas:', error);
      throw new InternalServerErrorException();
    }
  }

  async create(
    createPerguntaDto: CreatePerguntaDto,
  ): Promise<PerguntaResponseDto> {
    try {
      const step = await this.stepRepository.findOneBy({
        id: createPerguntaDto.step_id,
      });

      if (!step) {
        throw new NotFoundException(
          `Step com ID ${createPerguntaDto.step_id} não encontrado. Verifique se o step existe e tente novamente.`,
        );
      }

      if (createPerguntaDto.dadoId) {
        const dado = await this.dadoRepository.findOneBy({
          id: createPerguntaDto.dadoId,
        });

        if (!dado) {
          throw new NotFoundException('Dado não encontrado');
        }
      }
      const savedPergunta = await this.createPerguntaUseCase.execute({
        stepId: createPerguntaDto.step_id,
        tipoPergunta: createPerguntaDto.tipo_Pergunta,
        texto: createPerguntaDto.pergunta,
        obrigatoria: createPerguntaDto.obrigatoriedade,
        opcoes: createPerguntaDto.opcoes ?? [],
        tipoFormatacao: createPerguntaDto.tipo_formatacao ?? null,
        dadoId: createPerguntaDto.dadoId ?? null,
      });

      return this.toResponse(savedPergunta);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao criar pergunta:', error);
      throw new InternalServerErrorException();
    }
  }

  async update(
    id: number,
    updatePerguntaDto: UpdatePerguntaDto,
  ): Promise<PerguntaResponseDto> {
    try {
      if (updatePerguntaDto.dadoId !== undefined) {
        if (updatePerguntaDto.dadoId !== null && updatePerguntaDto.dadoId !== 0) {
          const dado = await this.dadoRepository.findOneBy({
            id: updatePerguntaDto.dadoId,
          });
          if (!dado) {
            throw new NotFoundException(
              `Dado com ID ${updatePerguntaDto.dadoId} não encontrado`,
            );
          }
        }
      }

      const updatedPergunta = await this.updatePerguntaUseCase.execute(id, {
        texto: updatePerguntaDto.pergunta,
        obrigatoria: updatePerguntaDto.obrigatoriedade,
        opcoes: updatePerguntaDto.opcoes,
        tipoFormatacao: updatePerguntaDto.tipo_formatacao,
        dadoId:
          updatePerguntaDto.dadoId === 0
            ? null
            : (updatePerguntaDto.dadoId ?? undefined),
      });
      return this.toResponse(updatedPergunta);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof Error && error.message === 'Pergunta não encontrada') {
        throw new NotFoundException('Pergunta não encontrada');
      }
      console.error('Erro ao atualizar pergunta:', error);
      throw new InternalServerErrorException();
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    try {
      await this.removePerguntaUseCase.execute(id);
      return { message: 'Pergunta removida com sucesso' };
    } catch (error) {
      if (error instanceof Error && error.message === 'Pergunta não encontrada') {
        throw new NotFoundException('Pergunta não encontrada');
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao remover pergunta:', error);
      throw new InternalServerErrorException();
    }
  }

  private async toResponse(pergunta: PerguntaData): Promise<PerguntaResponseDto> {
    const dado =
      pergunta.dadoId && pergunta.dadoId > 0
        ? await this.dadoRepository.findOneBy({ id: pergunta.dadoId })
        : null;

    const payload = {
      id: pergunta.id,
      pergunta: pergunta.texto,
      tipo_Pergunta: pergunta.tipoPergunta,
      obrigatoriedade: pergunta.obrigatoria,
      opcoes: pergunta.opcoes ?? [],
      tipo_formatacao: pergunta.tipoFormatacao,
      dado: dado ? { id: dado.id, nome: dado.nome } : undefined,
    };

    const perguntaDto = plainToInstance(PerguntaResponseDto, payload, {
      excludeExtraneousValues: true,
    });
    perguntaDto.placeholder =
      InputFormatPlaceholders[
        (pergunta.tipoFormatacao ?? 'none') as keyof typeof InputFormatPlaceholders
      ];
    return perguntaDto;
  }
}
