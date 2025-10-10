import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import type { EntityManager, Repository } from 'typeorm';
import { CreateEditalDto } from './dto/create-edital.dto';
import { UpdateEditalDto } from './dto/update-edital.dto';
import { UpdateStatusEditalDto } from './dto/update-status-edital.dto';
import { Edital } from 'src/entities/edital/edital.entity';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';

import { StatusEdital } from 'src/enum/enumStatusEdital';
import { EditalResponseDto } from './dto/edital-response.dto';
import { plainToInstance } from 'class-transformer';
import { Aluno } from '../entities/aluno/aluno.entity';

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
    console.log('🔥 MÉTODO REMOVE ATUALIZADO - ID:', id);
    try {
      const edital = await this.editaisRepository.findOne({
        where: { id },
        relations: ['vagas', 'vagas.inscricoes', 'steps'],
      });

      if (!edital) {
        throw new NotFoundException('Edital não encontrado');
      }

      console.log('📊 Edital encontrado:', {
        id: edital.id,
        titulo: edital.titulo_edital,
        quantidadeVagas: edital.vagas?.length || 0,
      });

      // Verifica se há vagas com inscrições associadas
      if (edital.vagas && edital.vagas.length > 0) {
        const hasInscricoes = edital.vagas.some(
          (vaga) => vaga.inscricoes && vaga.inscricoes.length > 0,
        );

        if (hasInscricoes) {
          throw new BadRequestException(
            'Não é possível excluir o edital pois existem inscrições vinculadas às vagas',
          );
        }

        console.log('🗑️ Removendo vagas primeiro...');
      }

      // Remove em transação para garantir consistência
      await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          // Remove as vagas manualmente primeiro (se existirem)
          if (edital.vagas && edital.vagas.length > 0) {
            await transactionalEntityManager.remove(edital.vagas);
          }

          // Remove os steps manualmente (se existirem)
          if (edital.steps && edital.steps.length > 0) {
            await transactionalEntityManager.remove(edital.steps);
          }

          // Agora remove o edital
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

  async getAlunosInscritos(id: number): Promise<Aluno[]> {
    try {
      const editalExists = await this.editaisRepository.existsBy({ id });
      
      if (!editalExists) {
        throw new NotFoundException('Edital não encontrado');
      }

      // Query otimizada: busca diretamente os alunos usando query builder
      // Evita carregar o edital completo e faz JOIN apenas do necessário
      const alunos = await this.entityManager
        .createQueryBuilder(Aluno, 'aluno')
        .innerJoin('aluno.inscricoes', 'inscricao')
        .innerJoin('inscricao.vagas', 'vaga')
        .innerJoin('vaga.edital', 'edital')
        .innerJoinAndSelect('aluno.usuario', 'usuario')
        .where('edital.id = :editalId', { editalId: id })
        .distinct(true)
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

      // Mapeamento do parâmetro para o enum
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

      // Validações de transição de status
      await this.validateStatusTransition(edital, statusAtual, novoStatus);

      // Atualiza o status
      await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          edital.status_edital = novoStatus;
          await transactionalEntityManager.save(edital);
        },
      );

      // Busca os dados atualizados
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

      // Validações de transição de status
      await this.validateStatusTransition(edital, statusAtual, novoStatus);

      // Atualiza o status
      await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          edital.status_edital = novoStatus;
          await transactionalEntityManager.save(edital);
        },
      );

      // Busca os dados atualizados
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
    // Validação para ABERTO ou EM_ANDAMENTO: todos os dados devem estar preenchidos
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

    // Validação para ENCERRADO: deve estar ABERTO ou EM_ANDAMENTO
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
    // Verifica se todos os campos obrigatórios estão preenchidos
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
