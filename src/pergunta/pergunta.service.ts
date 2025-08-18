import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { EntityManager, Repository } from 'typeorm';
import { Pergunta } from '../entities/edital/pergunta.entity';
import { Step } from '../entities/edital/step.entity';
import { InputFormatPlaceholders } from '../enum/enumInputFormat';
import { CreatePerguntaDto } from './dto/create-pergunta.dto';
import { UpdatePerguntaDto } from './dto/update-pergunta.dto';
import { PerguntaResponseDto } from '../step/dto/response-pergunta.dto';

@Injectable()
export class PerguntaService {
  constructor(
    @InjectRepository(Pergunta) private readonly perguntaRepository: Repository<Pergunta>,
    @InjectRepository(Step) private readonly stepRepository: Repository<Step>,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  // Listar perguntas de um step específico
  async findByStep(stepId: number): Promise<PerguntaResponseDto[]> {
    try {
      const perguntas = await this.perguntaRepository.find({
        where: { step: { id: stepId } },
      });

      if (!perguntas || perguntas.length === 0) {
        throw new NotFoundException(`Nenhuma pergunta encontrada para o step com ID ${stepId}. Verifique se o step existe e possui perguntas cadastradas.`);
      }

      // Transform perguntas and calculate placeholder
      return perguntas.map((pergunta) => {
        const perguntaDto = plainToInstance(PerguntaResponseDto, pergunta, {
          excludeExtraneousValues: true,
        });

        perguntaDto.placeholder = InputFormatPlaceholders[pergunta.tipo_formatacao];

        return perguntaDto;
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao buscar perguntas:', error);
      throw new InternalServerErrorException();
    }
  }

  // Criar uma nova pergunta
  async create(createPerguntaDto: CreatePerguntaDto): Promise<PerguntaResponseDto> {
    try {
      // Verificar se o step existe
      const step = await this.stepRepository.findOneBy({ id: createPerguntaDto.step_id });
      
      if (!step) {
        throw new NotFoundException(`Step com ID ${createPerguntaDto.step_id} não encontrado. Verifique se o step existe e tente novamente.`);
      }

      const pergunta = new Pergunta({
        tipo_Pergunta: createPerguntaDto.tipo_Pergunta,
        pergunta: createPerguntaDto.pergunta,
        obrigatoriedade: createPerguntaDto.obrigatoriedade,
        opcoes: createPerguntaDto.opcoes,
        tipo_formatacao: createPerguntaDto.tipo_formatacao,
        step: step,
      });

      const savedPergunta = await this.perguntaRepository.save(pergunta);

      const perguntaDto = plainToInstance(PerguntaResponseDto, savedPergunta, {
        excludeExtraneousValues: true,
      });

      perguntaDto.placeholder = InputFormatPlaceholders[savedPergunta.tipo_formatacao];

      return perguntaDto;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao criar pergunta:', error);
      throw new InternalServerErrorException();
    }
  }

  // Atualizar uma pergunta
  async update(id: number, updatePerguntaDto: UpdatePerguntaDto): Promise<PerguntaResponseDto> {
    try {
      const pergunta = await this.perguntaRepository.findOneBy({ id });

      if (!pergunta) {
        throw new NotFoundException('Pergunta não encontrada');
      }

      await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          Object.assign(pergunta, updatePerguntaDto);
          await transactionalEntityManager.save(pergunta);
        },
      );

      // Busca os dados atualizados
      const updatedPergunta = await this.perguntaRepository.findOneBy({ id });

      if (!updatedPergunta) {
        throw new InternalServerErrorException('Erro ao buscar pergunta atualizada');
      }

      const perguntaDto = plainToInstance(PerguntaResponseDto, updatedPergunta, {
        excludeExtraneousValues: true,
      });

      perguntaDto.placeholder = InputFormatPlaceholders[updatedPergunta.tipo_formatacao];

      return perguntaDto;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao atualizar pergunta:', error);
      throw new InternalServerErrorException();
    }
  }

  // Remover uma pergunta
  async remove(id: number): Promise<{ message: string }> {
    try {
      const pergunta = await this.perguntaRepository.findOne({
        where: { id },
      });

      if (!pergunta) {
        throw new NotFoundException('Pergunta não encontrada');
      }

      await this.perguntaRepository.delete({ id });

      return { message: 'Pergunta removida com sucesso' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao remover pergunta:', error);
      throw new InternalServerErrorException();
    }
  }
}
