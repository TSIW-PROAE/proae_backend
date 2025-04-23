import { Injectable } from '@nestjs/common';
import type { EntityManager, Repository } from 'typeorm';
import { CreateEditalDto } from './dto/create-edital.dto';
import { UpdateEditalDto } from './dto/update-edital.dto';
import { Edital } from 'src/entities/edital/edital.entity';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EtapaInscricao } from 'src/entities/etapaInscricao/etapaInscricao.entity';


@Injectable()
export class EditalService {
  constructor(
    @InjectRepository(Edital)
    private readonly editaisRepository: Repository<Edital>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) { }

  async create(createEditalDto: CreateEditalDto) {
    try {
      return await this.entityManager.transaction(async (transactionalEntityManager) => {
        const etapas = createEditalDto.etapas.map(etapaDto => {
          return new EtapaInscricao(etapaDto);
        });

        const edital = new Edital({
          ...createEditalDto,
          etapas,
        });

        // O cascade=true vai cuidar de salvar as etapas automaticamente
        await transactionalEntityManager.save(edital);
      });
    } catch (error) {
      console.error('Erro ao criar edital:', error);
      throw new Error(`Falha ao criar edital: ${error.message}`);
    }
  }

  async findAll() {
    return this.editaisRepository.find({
      relations: {
        etapas: { resultados: true }
      },
      order: {
        data_inicio: 'ASC',
        etapas: { ordem: 'ASC' }
      }
    });
  }

  async findOne(id: number) {
    return this.editaisRepository.findOne({
      where: { id },
      relations: {
        etapas: { resultados: true }
      },
      order: {
        data_inicio: 'ASC',
        etapas: { ordem: 'ASC' }
      }
    });
  }

  async update(id: number, updateEditalDto: UpdateEditalDto) {
    try {
      const edital = await this.editaisRepository.findOneBy({ id });

      if (!edital) {
        throw new Error('Edital não encontrado');
      }

      await this.entityManager.transaction(async (transactionalEntityManager) => {
        Object.assign(edital, updateEditalDto);
        await transactionalEntityManager.save(edital);
      });

    } catch (error) {
      console.error('Error atualizando edital:', error);
      throw new Error('Error atualizando edital');
    }
  }

  async remove(id: number) {
    return 'Exclusão não implementada';
    // ondelete cascade não esta funcionando para excluir etapas automaticamente
    // await this.editaisRepository.delete(id);
  }
}
