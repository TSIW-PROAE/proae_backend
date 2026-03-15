import { Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Edital } from '../entities/edital/edital.entity';
import { Aluno } from '../entities/aluno/aluno.entity';
import { StatusEdital } from '../../../../core/shared-kernel/enums/enumStatusEdital';
import type {
  AlunoInscritoData,
} from '../../../../core/domain/edital/ports/edital.repository.port';
import type {
  EditalData,
  CreateEditalData,
  UpdateEditalData,
  StatusEditalDomain,
} from '../../../../core/domain/edital/edital.types';
import type { IEditalRepository } from '../../../../core/domain/edital/ports/edital.repository.port';

const STATUS_TO_ENUM: Record<StatusEditalDomain, StatusEdital> = {
  RASCUNHO: StatusEdital.RASCUNHO,
  ABERTO: StatusEdital.ABERTO,
  ENCERRADO: StatusEdital.ENCERRADO,
  EM_ANDAMENTO: StatusEdital.EM_ANDAMENTO,
};

const ENUM_TO_STATUS: Record<StatusEdital, StatusEditalDomain> = {
  [StatusEdital.RASCUNHO]: 'RASCUNHO',
  [StatusEdital.ABERTO]: 'ABERTO',
  [StatusEdital.ENCERRADO]: 'ENCERRADO',
  [StatusEdital.EM_ANDAMENTO]: 'EM_ANDAMENTO',
};

@Injectable()
export class EditalTypeOrmRepository implements IEditalRepository {
  constructor(
    @InjectRepository(Edital)
    private readonly editalRepository: Repository<Edital>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async create(data: CreateEditalData): Promise<EditalData> {
    const edital = new Edital({
      titulo_edital: data.titulo_edital,
      status_edital: StatusEdital.RASCUNHO,
      descricao: undefined,
      edital_url: undefined,
      etapa_edital: undefined,
    });
    const saved = await this.editalRepository.save(edital);
    return this.toEditalData(saved);
  }

  async findAll(): Promise<EditalData[]> {
    const list = await this.editalRepository.find({
      where: { is_formulario_geral: false },
    });
    return list.map((e) => this.toEditalData(e));
  }

  async findOne(id: number): Promise<EditalData | null> {
    const edital = await this.editalRepository.findOne({ where: { id } });
    return edital ? this.toEditalData(edital) : null;
  }

  async update(id: number, data: UpdateEditalData): Promise<EditalData> {
    const edital = await this.editalRepository.findOneBy({ id });
    if (!edital) throw new Error('Edital não encontrado');

    await this.entityManager.transaction(async (tx) => {
      Object.assign(edital, {
        titulo_edital: data.titulo_edital ?? edital.titulo_edital,
        descricao: data.descricao ?? edital.descricao,
        edital_url: data.edital_url ?? edital.edital_url,
        etapa_edital: data.etapa_edital ?? edital.etapa_edital,
      });
      await tx.save(edital);
    });

    const updated = await this.editalRepository.findOneBy({ id });
    return this.toEditalData(updated!);
  }

  async remove(id: number): Promise<void> {
    const edital = await this.editalRepository.findOne({
      where: { id },
      relations: ['vagas', 'vagas.inscricoes', 'steps'],
    });
    if (!edital) throw new Error('Edital não encontrado');

    if (edital.vagas?.some((v) => v.inscricoes?.length)) {
      throw new Error(
        'Não é possível excluir o edital pois existem inscrições vinculadas às vagas',
      );
    }

    await this.entityManager.transaction(async (tx) => {
      if (edital.vagas?.length) await tx.remove(edital.vagas);
      if (edital.steps?.length) await tx.remove(edital.steps);
      await tx.remove(edital);
    });
  }

  async findOpened(): Promise<EditalData[]> {
    const list = await this.editalRepository.find({
      where: { status_edital: StatusEdital.ABERTO, is_formulario_geral: false },
    });
    return list.map((e) => this.toEditalData(e));
  }

  async updateStatus(
    id: number,
    status: StatusEditalDomain,
  ): Promise<EditalData> {
    const edital = await this.editalRepository.findOneBy({ id });
    if (!edital) throw new Error('Edital não encontrado');
    const enumStatus = STATUS_TO_ENUM[status];
    await this.entityManager.transaction(async (tx) => {
      edital.status_edital = enumStatus;
      await tx.save(edital);
    });
    const updated = await this.editalRepository.findOneBy({ id });
    return this.toEditalData(updated!);
  }

  async getAlunosInscritos(
    editalId: number,
    limit: number,
    offset: number,
  ): Promise<AlunoInscritoData[]> {
    const skip = offset * limit;
    const alunos = await this.entityManager
      .createQueryBuilder(Aluno, 'aluno')
      .innerJoin('aluno.inscricoes', 'inscricao')
      .innerJoin('inscricao.vagas', 'vaga')
      .innerJoin('vaga.edital', 'edital')
      .innerJoinAndSelect('aluno.usuario', 'usuario')
      .where('edital.id = :editalId', { editalId })
      .distinct(true)
      .skip(skip)
      .take(limit)
      .getMany();

    return alunos.map((aluno) => ({
      aluno_id: aluno.aluno_id,
      matricula: aluno.matricula,
      curso: aluno.curso,
      campus: aluno.campus,
      data_ingresso: aluno.data_ingresso,
      usuario: {
        usuario_id: aluno.usuario!.usuario_id,
        email: aluno.usuario!.email,
        nome: aluno.usuario!.nome,
        cpf: aluno.usuario!.cpf,
        celular: aluno.usuario!.celular,
        data_nascimento: aluno.usuario!.data_nascimento,
        roles: aluno.usuario!.roles ?? [],
      },
    }));
  }

  private toEditalData(e: Edital): EditalData {
    return {
      id: e.id,
      titulo_edital: e.titulo_edital,
      descricao: e.descricao,
      edital_url: e.edital_url as EditalData['edital_url'],
      status_edital: ENUM_TO_STATUS[e.status_edital!],
      etapa_edital: e.etapa_edital as EditalData['etapa_edital'],
      created_at: (e as unknown as { created_at?: Date }).created_at,
      updated_at: (e as unknown as { updated_at?: Date }).updated_at,
    };
  }
}
