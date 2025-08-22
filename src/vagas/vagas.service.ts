import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { EntityManager, Repository } from 'typeorm';
import { Vagas } from '../entities/vagas/vagas.entity';
import { Edital } from '../entities/edital/edital.entity';
import { CreateVagaDto } from './dto/create-vaga.dto';
import { UpdateVagaDto } from './dto/update-vaga.dto';
import { VagaResponseDto } from './dto/vaga-response.dto';

@Injectable()
export class VagasService {
  constructor(
    @InjectRepository(Vagas) private readonly vagasRepository: Repository<Vagas>,
    @InjectRepository(Edital) private readonly editalRepository: Repository<Edital>,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  // Criar uma nova vaga
  async create(createVagaDto: CreateVagaDto): Promise<VagaResponseDto> {
    try {
      // Verificar se o edital existe
      const edital = await this.editalRepository.findOneBy({ id: createVagaDto.edital_id });
      
      if (!edital) {
        throw new NotFoundException(`Edital com ID ${createVagaDto.edital_id} não encontrado. Verifique se o edital existe e tente novamente.`);
      }

      const vaga = new Vagas({
        beneficio: createVagaDto.beneficio,
        descricao_beneficio: createVagaDto.descricao_beneficio,
        numero_vagas: createVagaDto.numero_vagas,
        edital: edital,
      });

      const savedVaga = await this.vagasRepository.save(vaga);

      return plainToInstance(VagaResponseDto, savedVaga, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao criar vaga:', error);
      throw new InternalServerErrorException();
    }
  }

  // Listar vagas de um edital específico
  async findByEdital(editalId: number): Promise<VagaResponseDto[]> {
    try {
      const vagas = await this.vagasRepository.find({
        where: { edital: { id: editalId } },
      });
      //console.log(vagas)
      
      // if (!vagas || vagas.length === 0) {
      //   console.log("foi")
      //   throw new NotFoundException(`Nenhuma vaga encontrada para o edital com ID ${editalId}. Verifique se o edital existe e possui vagas cadastradas.`);
      // }

      return plainToInstance(VagaResponseDto, vagas, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao buscar vagas:', error);
      throw new InternalServerErrorException();
    }
  }

  // Atualizar uma vaga
  async update(id: number, updateVagaDto: UpdateVagaDto): Promise<VagaResponseDto> {
    try {
      const vaga = await this.vagasRepository.findOneBy({ id });

      if (!vaga) {
        throw new NotFoundException(`Vaga com ID ${id} não encontrada.`);
      }

      await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          Object.assign(vaga, updateVagaDto);
          await transactionalEntityManager.save(vaga);
        },
      );

      // Busca os dados atualizados
      const updatedVaga = await this.vagasRepository.findOneBy({ id });

      if (!updatedVaga) {
        throw new InternalServerErrorException('Erro ao buscar vaga atualizada');
      }

      return plainToInstance(VagaResponseDto, updatedVaga, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao atualizar vaga:', error);
      throw new InternalServerErrorException();
    }
  }

  // Remover uma vaga
  async remove(id: number): Promise<{ message: string }> {
    try {
      const vaga = await this.vagasRepository.findOne({
        where: { id },
      });

      if (!vaga) {
        throw new NotFoundException(`Vaga com ID ${id} não encontrada.`);
      }

      await this.vagasRepository.delete({ id });

      return { message: 'Vaga removida com sucesso' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao remover vaga:', error);
      throw new InternalServerErrorException();
    }
  }
}
