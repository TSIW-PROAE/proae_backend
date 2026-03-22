import { Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Edital } from '../entities/edital/edital.entity';
import { Inscricao } from '../entities/inscricao/inscricao.entity';
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
    const inscricoes = await this.entityManager
      .createQueryBuilder(Inscricao, 'inscricao')
      .innerJoinAndSelect('inscricao.aluno', 'aluno')
      .innerJoinAndSelect('aluno.usuario', 'usuario')
      .innerJoinAndSelect('inscricao.vagas', 'vaga')
      .innerJoin('vaga.edital', 'edital')
      .where('edital.id = :editalId', { editalId })
      .orderBy('inscricao.data_inscricao', 'DESC')
      .addOrderBy('inscricao.id', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    const fmtDate = (d: Date | string | null | undefined): string | null => {
      if (d == null) return null;
      if (typeof d === 'string') return d;
      if (d instanceof Date) return d.toISOString().slice(0, 10);
      return String(d);
    };

    return inscricoes.map((insc) => {
      const aluno = insc.aluno;
      const u = aluno.usuario!;
      const di = insc.data_inscricao;
      const dataInsc =
        di instanceof Date
          ? di.toISOString()
          : typeof di === 'string'
            ? di
            : String(di);

      const vaga = insc.vagas;
      return {
        inscricao_id: insc.id,
        status_inscricao: String(insc.status_inscricao),
        status_beneficio_edital: String(insc.status_beneficio_edital),
        beneficio_nome: vaga?.beneficio ?? null,
        data_inscricao: dataInsc,
        aluno_id: aluno.aluno_id,
        usuario_id: u.usuario_id,
        email: u.email,
        nome: u.nome,
        cpf: u.cpf,
        celular: u.celular,
        data_nascimento: fmtDate(u.data_nascimento),
        matricula: aluno.matricula,
        curso: aluno.curso,
        campus: String(aluno.campus),
        data_ingresso: aluno.data_ingresso,
      };
    });
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
