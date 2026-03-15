import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import type { EntityManager, Repository } from 'typeorm';
import { StatusEdital } from 'src/core/shared-kernel/enums/enumStatusEdital';
import { Aluno } from 'src/infrastructure/persistence/typeorm/entities/aluno/aluno.entity';
import { Edital } from 'src/infrastructure/persistence/typeorm/entities/edital/edital.entity';
import { CreateEditalDto } from './dto/create-edital.dto';
import { EditalResponseDto } from './dto/edital-response.dto';
import { UpdateEditalDto } from './dto/update-edital.dto';
import { UpdateStatusEditalDto } from './dto/update-status-edital.dto';

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
      const editais = await this.editaisRepository.find({
        where: { is_formulario_geral: false },
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
          const { ...updateData } = updateEditalDto;
          Object.assign(edital, updateData);
          await transactionalEntityManager.save(edital);
        },
      );

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
        relations: ['vagas', 'vagas.inscricoes', 'steps'],
      });

      if (!edital) {
        throw new NotFoundException('Edital não encontrado');
      }

      if (edital.vagas && edital.vagas.length > 0) {
        const hasInscricoes = edital.vagas.some(
          (vaga) => vaga.inscricoes && vaga.inscricoes.length > 0,
        );

        if (hasInscricoes) {
          throw new BadRequestException(
            'Não é possível excluir o edital pois existem inscrições vinculadas às vagas',
          );
        }
      }

      await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          if (edital.vagas && edital.vagas.length > 0) {
            await transactionalEntityManager.remove(edital.vagas);
          }

          if (edital.steps && edital.steps.length > 0) {
            await transactionalEntityManager.remove(edital.steps);
          }

          await transactionalEntityManager.remove(edital);
        },
      );

      return { message: 'Edital removido com sucesso' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Falha ao excluir edital:', error);
      throw new InternalServerErrorException(
        'Erro interno ao excluir o edital',
      );
    }
  }

  async getEditalOpedened(): Promise<EditalResponseDto[]> {
    try {
      const editais = await this.editaisRepository.find({
        where: { status_edital: StatusEdital.ABERTO, is_formulario_geral: false },
      });
      return plainToInstance(EditalResponseDto, editais, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error('Erro ao buscar editais abertos:', error);
      throw new InternalServerErrorException();
    }
  }

  async getAlunosInscritos(id: number, limit = 20, offset = 0): Promise<Aluno[]> {
    try {
      const editalExists = await this.editaisRepository.existsBy({ id });

      if (!editalExists) {
        throw new NotFoundException('Edital não encontrado');
      }

      const skip = offset * limit;

      const alunos = await this.entityManager
        .createQueryBuilder(Aluno, 'aluno')
        .innerJoin('aluno.inscricoes', 'inscricao')
        .innerJoin('inscricao.vagas', 'vaga')
        .innerJoin('vaga.edital', 'edital')
        .innerJoinAndSelect('aluno.usuario', 'usuario')
        .where('edital.id = :editalId', { editalId: id })
        .distinct(true)
        .skip(skip)
        .take(limit)
        .getMany();

      return alunos;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao buscar alunos do edital:', error);
      throw new InternalServerErrorException('Erro ao buscar alunos inscritos no edital');
    }
  }

  async updateStatusByParam(
    id: number,
    statusParam: 'RASCUNHO' | 'ABERTO' | 'ENCERRADO' | 'EM_ANDAMENTO',
  ): Promise<EditalResponseDto> {
    try {
      const edital = await this.editaisRepository.findOneBy({ id });

      if (!edital) {
        throw new NotFoundException('Edital não encontrado');
      }

      const statusMapping: Record<string, StatusEdital> = {
        RASCUNHO: StatusEdital.RASCUNHO,
        ABERTO: StatusEdital.ABERTO,
        ENCERRADO: StatusEdital.ENCERRADO,
        EM_ANDAMENTO: StatusEdital.EM_ANDAMENTO,
      };

      const novoStatus = statusMapping[statusParam];

      if (!novoStatus) {
        throw new BadRequestException(
          'Status inválido. Use: RASCUNHO, ABERTO, ENCERRADO ou EM_ANDAMENTO',
        );
      }

      const statusAtual = edital.status_edital;
      await this.validateStatusTransition(edital, statusAtual, novoStatus);

      await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          edital.status_edital = novoStatus;
          await transactionalEntityManager.save(edital);
        },
      );

      const updatedEdital = await this.editaisRepository.findOneBy({ id });

      return plainToInstance(EditalResponseDto, updatedEdital, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Erro ao atualizar status do edital:', error);
      throw new InternalServerErrorException();
    }
  }

  async updateStatus(
    id: number,
    updateStatusDto: UpdateStatusEditalDto,
  ): Promise<EditalResponseDto> {
    try {
      const edital = await this.editaisRepository.findOneBy({ id });

      if (!edital) {
        throw new NotFoundException('Edital não encontrado');
      }

      const novoStatus = updateStatusDto.status_edital;
      const statusAtual = edital.status_edital;
      await this.validateStatusTransition(edital, statusAtual, novoStatus);

      await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          edital.status_edital = novoStatus;
          await transactionalEntityManager.save(edital);
        },
      );

      const updatedEdital = await this.editaisRepository.findOneBy({ id });

      return plainToInstance(EditalResponseDto, updatedEdital, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Erro ao atualizar status do edital:', error);
      throw new InternalServerErrorException();
    }
  }

  private async validateStatusTransition(
    edital: Edital,
    statusAtual: StatusEdital,
    novoStatus: StatusEdital,
  ): Promise<void> {
    if (
      novoStatus === StatusEdital.ABERTO ||
      novoStatus === StatusEdital.EM_ANDAMENTO
    ) {
      if (!this.isEditalComplete(edital)) {
        throw new BadRequestException(
          'Para alterar o status para ABERTO ou EM_ANDAMENTO, todos os dados do edital devem estar preenchidos',
        );
      }
    }

    if (novoStatus === StatusEdital.ENCERRADO) {
      if (
        statusAtual !== StatusEdital.ABERTO &&
        statusAtual !== StatusEdital.EM_ANDAMENTO
      ) {
        throw new BadRequestException(
          'Só é possível alterar para ENCERRADO se o edital estiver ABERTO ou EM_ANDAMENTO',
        );
      }
    }
  }

  private isEditalComplete(edital: Edital): boolean {
    return !!(
      edital.titulo_edital &&
      edital.descricao &&
      edital.edital_url &&
      edital.edital_url.length > 0 &&
      edital.etapa_edital &&
      edital.etapa_edital.length > 0
    );
  }
}
