import { Injectable } from '@nestjs/common';
import type { EntityManager, Repository } from 'typeorm';
import { CreateEditalDto } from './dto/create-edital.dto';
import { UpdateEditalDto } from './dto/update-edital.dto';
import { Edital } from 'src/entities/edital/edital.entity';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EtapaInscricao } from 'src/entities/etapaInscricao/etapaInscricao.entity';
import { ResultadoEtapa } from 'src/entities/resultadoEtapa/resultadoEtapa.entity';

@Injectable()
export class EditalService {
  constructor(
    @InjectRepository(Edital)
    private readonly editaisRepository: Repository<Edital>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async create(createEditalDto: CreateEditalDto) {
    try {
      return await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          const etapas = createEditalDto.etapas.map((etapaDto) => {
            return new EtapaInscricao(etapaDto);
          });

          const edital = new Edital({
            ...createEditalDto,
            etapas,
          });

          // O cascade=true vai cuidar de salvar as etapas automaticamente
          await transactionalEntityManager.save(edital);
        },
      );
    } catch (error) {
      console.error('Erro ao criar edital:', error);
      throw new Error(`Falha ao criar edital: ${error.message}`);
    }
  }

  async findAll() {
    return this.editaisRepository.find({
      relations: {
        etapas: { resultados: true },
      },
      order: {
        etapas: { ordem: 'ASC' },
      },
    });
  }

  async findOne(id: number) {
    return this.editaisRepository.findOne({
      where: { id },
      relations: {
        etapas: { resultados: true },
      },
      order: {
        etapas: { ordem: 'ASC' },
      },
    });
  }

  async update(id: number, updateEditalDto: UpdateEditalDto) {
    try {
      const edital = await this.editaisRepository.findOneBy({ id });

      if (!edital) {
        throw new Error('Edital não encontrado');
      }

      await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          Object.assign(edital, updateEditalDto);
          await transactionalEntityManager.save(edital);
        },
      );
    } catch (error) {
      console.error('Error atualizando edital:', error);
      throw new Error('Error atualizando edital');
    }
  }

  async remove(id: number) {
    try {
      return await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          const edital = await transactionalEntityManager.findOne(Edital, {
            where: { id },
            relations: {
              etapas: { resultados: true },
            },
          });

          if (!edital) {
            return 'Edital com id: ' + id + ' não encontrado';
          }

          // Exclui os resultados associados às etapas do edital
          for (const etapa of edital.etapas) {
            if (etapa.resultados && etapa.resultados.length > 0) {
              await transactionalEntityManager.delete(ResultadoEtapa, {
                etapa: { id: etapa.id },
              });
            }
          }

          // Exclui as etapas associadas ao edital
          await transactionalEntityManager.delete(EtapaInscricao, {
            edital: { id },
          });

          // Exclui o edital
          await transactionalEntityManager.delete(Edital, { id });

          return {
            message: 'Edital e entidades relacionadas excluídos com sucesso',
          };
        },
      );
    } catch (error) {
      throw new Error(`Falha ao excluir edital: ${error.message}`);
    }
  }
}
